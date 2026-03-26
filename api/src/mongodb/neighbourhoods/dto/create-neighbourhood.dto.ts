import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { GeoJsonPolygon } from '../../../entities/mongodb/Neighbourhood';

export class CreateNeighbourhoodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsOptional()
  geometry?: GeoJsonPolygon;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}
