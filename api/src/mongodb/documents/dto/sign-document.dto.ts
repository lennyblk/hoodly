import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SignDocumentDto {
  @ApiProperty({
    description: 'JWT OTP token obtenu via POST /auth/otp/verify',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  otpToken: string;

  @ApiPropertyOptional({
    description: 'Image de signature en base64 PNG (sans préfixe data:image/png;base64,)',
  })
  @IsOptional()
  @IsString()
  signatureImage?: string;
}
