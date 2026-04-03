import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VoteType {
  YESNO = 'yesno',
  MULTIPLE = 'multiple',
}

export class VoteResult {
  @ApiProperty({ example: 'Pour' })
  option: string;

  @ApiProperty({ example: ['64a1f2c3e4b5f6a7b8c9d0e1'], type: [String] })
  userIds: ObjectId[];
}

@Entity('votes')
export class Vote {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty({ example: 'Faut-il installer des bancs dans le parc ?' })
  @Column()
  question: string;

  @ApiProperty({ enum: VoteType, default: VoteType.YESNO })
  @Column({ default: VoteType.YESNO })
  type: VoteType;

  @ApiProperty({ example: ['Pour', 'Contre'], type: [String] })
  @Column({ type: 'array' })
  options: string[];

  @ApiProperty({ example: false, default: false })
  @Column({ default: false })
  isAnonymous: boolean;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z' })
  @Column()
  endsAt: Date;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string' })
  neighbourhoodId: string;

  @ApiPropertyOptional({ type: [VoteResult] })
  @Column({ type: 'array', nullable: true })
  results: VoteResult[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
