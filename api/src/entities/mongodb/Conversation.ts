import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

@Entity('conversations')
export class Conversation {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'array' })
  participants: string[];

  @Column({ type: 'string', nullable: true })
  lastMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
