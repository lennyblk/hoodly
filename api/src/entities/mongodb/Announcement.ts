import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

export enum AnnouncementType {
  OFFER = 'offer',
  REQUEST = 'request',
}

export enum AnnouncementStatus {
  OPEN = 'open',
  ACCEPTED = 'accepted',
  DONE = 'done',
}

@Entity('announcements')
export class Announcement {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'string' })
  authorId: string;

  @Column({ type: 'string' })
  neighbourhoodId: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  type: AnnouncementType;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ default: 0 })
  points: number;

  @Column({ default: AnnouncementStatus.OPEN })
  status: AnnouncementStatus;

  @Column({ type: 'string', nullable: true })
  acceptedBy: string;

  @Column({ type: 'string', nullable: true })
  contractId: string;

  @CreateDateColumn()
  createdAt: Date;
}
