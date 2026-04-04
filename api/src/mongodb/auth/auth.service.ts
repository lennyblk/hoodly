import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { User, UserRole, UserLang } from '../../entities/mongodb/User';
import { RefreshToken } from '../../entities/mongodb/RefreshToken';
import { Tokens } from './types';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User, 'mongodb')
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken, 'mongodb')
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) { }

  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ _id: new ObjectId(id) });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async getTokens(userId: string, email: string): Promise<Tokens> {
    const payload = { userId, email };

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

    const hash = await this.hashData(dto.password);
    const newUser = await this.userRepository.save(
      this.userRepository.create({
        role: UserRole.HABITANT,
        points: 0,
        isActive: true,
        lang: UserLang.FR,
        ...dto,
        password: hash,
      }),
    );

    const tokens = await this.getTokens(newUser._id.toString(), newUser.email);
    await this.storeRefreshToken(newUser._id.toString(), tokens.refresh_token);
    return tokens;
  }

  async signin(dto: SigninDto): Promise<Tokens> {
    const user = await this.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user._id.toString(), user.email);
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

    const tokens = await this.getTokens(userId, email);
    await this.storeRefreshToken(userId, tokens.refresh_token);
    return tokens;
  }
}
