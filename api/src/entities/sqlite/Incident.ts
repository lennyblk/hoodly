import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum IncidentStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  category: string;

  @Column({ default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @Column()
  reportedBy: string; 

  @Column()
  neighborhoodId: string;

  @Column()
  reportedAt: Date;

  @Column({ nullable: true })
  syncedAt: Date;

  @Column({ type: 'int', default: 0 })
  isDirty: number;
}