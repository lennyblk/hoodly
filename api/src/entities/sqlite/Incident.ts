import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum IncidentStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

@Entity('incidents')
export class Incident {
  @PrimaryColumn()
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
  reportedBy: string; // FK -> users.id

  @Column()
  neighborhoodId: string;

  @Column()
  reportedAt: Date;

  @Column({ nullable: true })
  syncedAt: Date;

  @Column({ type: 'int', default: 0 })
  isDirty: number; // 0 or 1 (offline flag)
}
