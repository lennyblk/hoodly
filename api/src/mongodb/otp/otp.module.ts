import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { UsersService } from '../users/users.service';
import { User } from '../../entities/mongodb/User';

@Module({
  imports: [
    TypeOrmModule.forFeature([User], 'mongodb'),
    JwtModule.register({}),
  ],
  controllers: [OtpController],
  providers: [OtpService, UsersService],
  exports: [OtpService],
})
export class OtpModule {}
