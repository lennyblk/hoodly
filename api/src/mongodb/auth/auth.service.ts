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
import { User } from '../../entities/mongodb/User';
import { Tokens } from './types';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User, 'mongodb')
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  findOne(id: string) {
    return this.userRepository.findOne({ where: { _id: new ObjectId(id) } as any });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async getTokens(userId: string, email: string): Promise<Tokens> {
    const payload = { userId, email };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  async signup(dto: SignupDto): Promise<Tokens> {
    if ((await this.findByEmail(dto.email)) !== null) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    const hash = await this.hashData(dto.password);
    const newUser = await this.userRepository.save(
      this.userRepository.create({ ...dto, password: hash }),
    );

    return this.getTokens(newUser.id, newUser.email);
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

    return this.getTokens(user.id, user.email);
  }

  logout() { }
  refreshToken() { }
}
