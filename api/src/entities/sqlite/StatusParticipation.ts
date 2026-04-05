import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('status_participation')
export class StatusParticipation {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string; // FK -> users.id

  @Column()
  eventId: string;

  @Column()
  participatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  syncedAt: Date | null;
}
