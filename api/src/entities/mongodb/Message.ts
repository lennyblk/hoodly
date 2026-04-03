import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageType {
  IMAGE = 'image',
  AUDIO = 'audio',
  TEXT = 'text',
}

@Entity('messages')
export class Message {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string' })
  conversationId: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e3' })
  @Column({ type: 'string' })
  senderId: string;

  @ApiProperty({ enum: MessageType, default: MessageType.TEXT })
  @Column({ default: MessageType.TEXT })
  type: MessageType;

  @ApiPropertyOptional({ example: 'Bonjour tout le monde !' })
  @Column({ nullable: true })
  content: string;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e4' })
  @Column({ nullable: true })
  fileId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
