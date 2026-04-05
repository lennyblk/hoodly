import { IsString, IsOptional, IsObject } from 'class-validator';
import { GeoJsonPolygon } from '../../../entities/sqlite/NeighbourhoodSqlite';

export class CreateNeighbourhoodSqliteDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  geometry?: GeoJsonPolygon;

  @IsString()
  createdBy: string;

}