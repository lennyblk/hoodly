import { PartialType } from '@nestjs/mapped-types';
import { CreateNeighbourhoodSqliteDto } from './create-neighbourhood.dto';

export class UpdateNeighbourhoodSqliteDto extends PartialType(CreateNeighbourhoodSqliteDto) {}