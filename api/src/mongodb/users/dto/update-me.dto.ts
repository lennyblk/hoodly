import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'john.doe@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NouveauMdp1!' })
  @IsOptional()
  @IsStrongPassword()
  password?: string;

  @ApiPropertyOptional({ example: 'John', minLength: 2, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', minLength: 2, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '15 rue de la Paix, 75018 Paris', description: 'Changer son adresse re-géocode automatiquement le quartier' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e1', description: 'Rejoindre (ou null pour quitter) un quartier' })
  @IsOptional()
  @IsString()
  neighbourhoodId?: string;
}
