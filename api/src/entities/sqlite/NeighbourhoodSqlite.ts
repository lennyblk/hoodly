import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

@Entity('neighbourhoods')
export class NeighbourhoodSqlite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  syncedAt: Date;
}