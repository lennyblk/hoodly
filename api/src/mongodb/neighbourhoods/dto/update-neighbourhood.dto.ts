import { IsObject, IsOptional, IsString } from 'class-validator';
import { GeoJsonPolygon } from '../../../entities/mongodb/Neighbourhood';

export class UpdateNeighbourhoodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  geometry?: GeoJsonPolygon;

  @IsString()
  @IsOptional()
  createdBy?: string;
}
