import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignDocumentDto {
  @ApiProperty({
    description: 'JWT OTP token obtenu via POST /auth/otp/verify',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  otpToken: string;
}
