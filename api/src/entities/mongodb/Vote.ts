import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

export enum VoteType {
  YESNO = 'yesno',
  MULTIPLE = 'multiple',
}

export interface VoteResult {
  option: string;
  userIds: ObjectId[];
}

@Entity('votes')
export class Vote {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  question: string;

  @Column({ default: VoteType.YESNO })
  type: VoteType;

  @Column({ type: 'array' })
  options: string[];

  @Column({ default: false })
  isAnonymous: boolean;

  @Column()
  endsAt: Date;

  @Column({ type: 'string' })
  neighbourhoodId: string;

  @Column({ type: 'array', nullable: true })
  results: VoteResult[];

  @CreateDateColumn()
  createdAt: Date;
}
