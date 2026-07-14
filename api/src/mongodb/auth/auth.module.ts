import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { OtpModule } from '../otp/otp.module';
import { AtStrategy, RtStrategy } from './strategies';
import { User } from '../../entities/mongodb/User';
import { RefreshToken } from '../../entities/mongodb/RefreshToken';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Neighbourhood], 'mongodb'),
    JwtModule.register({}),
    PassportModule,
    OtpModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RtStrategy],
})
export class AuthModule {}
