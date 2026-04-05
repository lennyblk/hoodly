
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserSqliteDto } from './create-user.dto';

export class UpdateUserSqliteDto extends PartialType(CreateUserSqliteDto) {}