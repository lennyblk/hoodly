import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('conversations')
export class Conversation {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty({ example: ['64a1f2c3e4b5f6a7b8c9d0e2', '64a1f2c3e4b5f6a7b8c9d0e3'], type: [String] })
  @Column({ type: 'array' })
  participants: string[];

  @ApiPropertyOptional({ example: 'Bonjour !' })
  @Column({ type: 'string', nullable: true })
  lastMessage: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
