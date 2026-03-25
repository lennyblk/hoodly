import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('neighborhoods')
export class NeighbourhoodSqlite {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  syncedAt: Date;
}
