import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

@Entity('neighbourhoods')
export class Neighbourhood {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  name: string;

  @Column({ type: 'json', nullable: true })
  geometry: GeoJsonPolygon;

  @Column({ type: 'string' })
  createdBy: string; // FK -> User (admin)

  @CreateDateColumn()
  createdAt: Date;
}
