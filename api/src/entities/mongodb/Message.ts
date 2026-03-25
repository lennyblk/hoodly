import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

export enum MessageType {
  IMAGE = 'image',
  AUDIO = 'audio',
  TEXT = 'text',
}

@Entity('messages')
export class Message {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'string' })
  conversationId: string;

  @Column({ type: 'string' })
  senderId: string;

  @Column({ default: MessageType.TEXT })
  type: MessageType;

  @Column({ nullable: true })
  content: string;

  @Column({ nullable: true })
  fileId: string; // GridFS file id

  @CreateDateColumn()
  createdAt: Date;
}
