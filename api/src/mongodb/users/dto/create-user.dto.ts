import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserLang, UserRole } from '../../../entities/mongodb/User';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  neighbourhoodId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(UserLang)
  lang?: UserLang;
}
