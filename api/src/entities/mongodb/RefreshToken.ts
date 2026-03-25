import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ type: 'string' })
  userId: string;

  @Column()
  token: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
