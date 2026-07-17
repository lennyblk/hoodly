import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { User, UserRole } from '../../entities/mongodb/User';
import { RefreshToken } from '../../entities/mongodb/RefreshToken';
import { Neighbourhood, GeoJsonPolygon } from '../../entities/mongodb/Neighbourhood';
import { Tokens } from './types';
import { ObjectId } from 'mongodb';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { OtpService } from '../otp/otp.service';
import { PointsService } from '../users/points.service';
import { geocodeAddress, pointInPolygon } from '../../common/utils/geo';
import { NeighbourhoodRequestEmail } from '../../emails/NeighbourhoodRequestEmail';

const OTP_BYPASS_EMAILS = [
  'admin@hoodly.com',
  'modo.montmartre@hoodly.com',
  'modo.belleville@hoodly.com',
  'modo.marais@hoodly.com',
  'alice@hoodly.com',
  'bob@hoodly.com',
  'julien@hoodly.com',
  'camille@hoodly.com',
  'charlie@hoodly.com',
  'diana@hoodly.com',
  'karim@hoodly.com',
  'lea@hoodly.com',
  'eve@hoodly.com',
  'frank@hoodly.com',
  'nadia@hoodly.com',
  'grace@hoodly.com',
  'hugo@hoodly.com',
  'omar@hoodly.com',
  'iris@hoodly.com',
  'thomas@hoodly.com',
  'sophie@hoodly.com',
  'remi@hoodly.com',
  'clara@hoodly.com',
];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User, 'mongodb')
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken, 'mongodb')
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Neighbourhood, 'mongodb')
    private neighbourhoodRepository: MongoRepository<Neighbourhood>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private pointsService: PointsService,
  ) { }

  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  private requiresOtp(email: string): boolean {
    return !OTP_BYPASS_EMAILS.includes(email.toLowerCase());
  }

  private async notifyAdminNoNeighbourhood(user: { firstName: string; lastName: string; email: string; address: string }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    if (!adminEmail) return;

    try {
      const html = await render(NeighbourhoodRequestEmail(user));
      await this.transporter.sendMail({
        from: `Hoodly <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `Nouvelle demande de quartier — ${user.address}`,
        html,
      });
    } catch (error) {
      console.error('[AUTH] Failed to send neighbourhood request email:', error);
    }
  }

  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ _id: new ObjectId(id) });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async getTokens(userId: string, email: string, role: UserRole, neighbourhoodId: string | null): Promise<Tokens> {
    const payload = { userId, email, role, neighbourhoodId };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET!,
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as any,
      }),
    ]);

    return { access_token, refresh_token };
  }

  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.delete({ userId });
    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({ userId, token: refreshToken, expiresAt }),
    );
  }

  async signup(dto: SignupDto): Promise<Tokens> {
    if ((await this.findByEmail(dto.email)) !== null) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    // Geocode address and find matching neighbourhood
    let neighbourhoodId: string | null = null;
    const coords = await geocodeAddress(dto.address);
    if (coords) {
      const neighbourhoods = await this.neighbourhoodRepository.find();
      const match = neighbourhoods.find(
        (n) => n.geometry && pointInPolygon(coords.lng, coords.lat, n.geometry),
      );
      if (match) {
        neighbourhoodId = match.id.toString();
      }
    }

    const hash = await this.hashData(dto.password);
    const newUser = await this.userRepository.save(
      this.userRepository.create({
        role: UserRole.HABITANT,
        points: 50,
        isActive: true,
        ...dto,
        password: hash,
        neighbourhoodId: neighbourhoodId as any,
      }),
    );
    await this.pointsService.logInitialBonus(newUser._id.toString(), 50, 'Bonus de bienvenue');

    // Notifier les admins si pas de quartier trouvé
    if (!neighbourhoodId) {
      this.notifyAdminNoNeighbourhood({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        address: dto.address,
      });
    }

    const tokens = await this.getTokens(newUser._id.toString(), newUser.email, newUser.role, newUser.neighbourhoodId);
    await this.storeRefreshToken(newUser._id.toString(), tokens.refresh_token);
    return tokens;
  }

  async signin(dto: SigninDto): Promise<Tokens | { otpRequired: true; message: string }> {
    const user = await this.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte a été désactivé');
    }

    // OTP bypass pour les emails de test/seed
    if (!this.requiresOtp(user.email)) {
      const tokens = await this.getTokens(user._id.toString(), user.email, user.role, user.neighbourhoodId);
      await this.storeRefreshToken(user._id.toString(), tokens.refresh_token);
      return tokens;
    }

    // Real email
    await this.otpService.send(user.email, user.firstName);
    return { otpRequired: true, message: 'Code OTP envoyé par email' };
  }

  async verifySigninOtp(email: string, code: string): Promise<Tokens> {
    // Verify OTP code
    await this.otpService.verify(email, code);

    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.getTokens(user._id.toString(), user.email, user.role, user.neighbourhoodId);
    await this.storeRefreshToken(user._id.toString(), tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ userId });
  }

  async refreshToken(userId: string, email: string, refreshToken: string): Promise<Tokens> {
    const stored = await this.refreshTokenRepository.findOne({ where: { userId } });

    if (!stored || stored.isRevoked || stored.token !== refreshToken || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const tokens = await this.getTokens(userId, email, user.role, user.neighbourhoodId);
    await this.storeRefreshToken(userId, tokens.refresh_token);
    return tokens;
  }
}
