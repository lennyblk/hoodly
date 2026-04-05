import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../../entities/sqlite/UserSqlite';

export class CreateUserSqliteDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  neighbourhoodId?: string;

  @IsOptional()
  @IsString()
  mongoId?: string;
}