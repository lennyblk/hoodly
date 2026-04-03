import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GeoJsonPolygon } from '../../../entities/mongodb/Neighbourhood';

export class UpdateNeighbourhoodDto {
  @ApiPropertyOptional({ example: 'Belleville' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: {
      type: 'Polygon',
      coordinates: [[[2.33, 48.88], [2.34, 48.88], [2.34, 48.89], [2.33, 48.89], [2.33, 48.88]]],
    },
  })
  @IsObject()
  @IsOptional()
  geometry?: GeoJsonPolygon;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e1' })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
