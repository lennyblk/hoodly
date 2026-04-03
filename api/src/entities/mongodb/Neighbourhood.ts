import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

@Entity('neighbourhoods')
export class Neighbourhood {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty({ example: 'Montmartre' })
  @Column()
  name: string;

  @ApiPropertyOptional({
    example: {
      type: 'Polygon',
      coordinates: [[[2.33, 48.88], [2.34, 48.88], [2.34, 48.89], [2.33, 48.89], [2.33, 48.88]]],
    },
  })
  @Column({ type: 'json', nullable: true })
  geometry: GeoJsonPolygon;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string' })
  createdBy: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
