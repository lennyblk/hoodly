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
import { UserLang } from '../../../entities/mongodb/User';

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

  @ApiPropertyOptional({ enum: UserLang })
  @IsOptional()
  @IsEnum(UserLang)
  lang?: UserLang;

  @ApiPropertyOptional({ example: '15 rue de la Paix, 75018 Paris', description: 'Changer son adresse re-géocode automatiquement le quartier' })
  @IsOptional()
  @IsString()
  address?: string;
}
