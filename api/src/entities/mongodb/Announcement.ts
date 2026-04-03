import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string' })
  authorId: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e3' })
  @Column({ type: 'string' })
  neighbourhoodId: string;

  @ApiProperty({ example: 'Tonte de pelouse' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Je propose de tondre la pelouse de mes voisins.' })
  @Column()
  description: string;

  @ApiProperty({ enum: AnnouncementType, example: AnnouncementType.OFFER })
  @Column()
  type: AnnouncementType;

  @ApiProperty({ example: false, default: false })
  @Column({ default: false })
  isPaid: boolean;

  @ApiProperty({ example: 0, default: 0 })
  @Column({ default: 0 })
  points: number;

  @ApiProperty({ enum: AnnouncementStatus, default: AnnouncementStatus.OPEN })
  @Column({ default: AnnouncementStatus.OPEN })
  status: AnnouncementStatus;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e4' })
  @Column({ type: 'string', nullable: true })
  acceptedBy: string;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e5' })
  @Column({ type: 'string', nullable: true })
  contractId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
