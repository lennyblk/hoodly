
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserSqliteDto } from './create-user.dto';

export class UpdateUserSqliteDto extends PartialType(CreateUserSqliteDto) {
  @IsOptional()
  @IsString()
  neighbourhoodId?: string;
}