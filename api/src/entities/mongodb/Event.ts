import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EventType {
  CONTRACT = 'contract',
  OTHER = 'other',
}

@Entity('events')
export class Event {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty({ example: 'Soirée de quartier' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Une soirée conviviale pour les habitants du quartier.' })
  @Column()
  description: string;

  @ApiProperty({ enum: EventType, default: EventType.OTHER })
  @Column({ default: EventType.OTHER })
  type: EventType;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string' })
  organizerId: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e3' })
  @Column({ type: 'string' })
  neighbourhoodId: string;

  @ApiProperty({ example: '2026-06-15T18:00:00.000Z' })
  @Column()
  date: Date;

  @ApiPropertyOptional({ example: ['64a1f2c3e4b5f6a7b8c9d0e4'], type: [String] })
  @Column({ type: 'array', nullable: true })
  participants: string[];

  @ApiPropertyOptional({ example: ['64a1f2c3e4b5f6a7b8c9d0e5'], type: [String] })
  @Column({ type: 'array', nullable: true })
  interestUsers: string[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
