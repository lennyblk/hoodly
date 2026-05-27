import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { UsersService } from '../users/users.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('OTP')
@Controller('auth/otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
  ) { }

  @ApiOperation({ summary: 'Envoyer un code OTP par email' })
  @ApiResponse({ status: 201, description: 'Code envoyé.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @Post('send')
  async send(@Body() dto: SendOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    const firstName = user?.firstName ?? dto.firstName ?? 'Utilisateur';
    await this.otpService.send(dto.email, firstName);
    return { message: 'Code envoyé' };
  }

  @ApiOperation({ summary: 'Vérifier un code OTP' })
  @ApiResponse({ status: 201, description: 'Code valide, OTP token retourné.' })
  @ApiResponse({ status: 400, description: 'Code incorrect ou expiré.' })
  @Post('verify')
  async verify(@Body() dto: VerifyOtpDto) {
    const otpToken = await this.otpService.verify(dto.email, dto.code);
    return { otpToken };
  }
}
