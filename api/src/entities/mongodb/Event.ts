import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

export enum EventType {
  CONTRACT = 'contract',
  OTHER = 'other',
}

@Entity('events')
export class Event {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: EventType.OTHER })
  type: EventType;

  @Column({ type: 'string' })
  organizerId: string;

  @Column({ type: 'string' })
  neighbourhoodId: string;

  @Column()
  date: Date;

  @Column({ type: 'array', nullable: true })
  participants: string[];

  @Column({ type: 'array', nullable: true })
  interestUsers: string[];

  @CreateDateColumn()
  createdAt: Date;
}
