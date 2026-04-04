import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  HABITANT = 'habitant',
  MODERATEUR = 'moderateur',
  ADMIN = 'admin',
}

export enum UserLang {
  FR = 'fr',
  EN = 'en',
}

@Entity('users')
export class User {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1', type: String })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({ example: 'john.doe@email.com' })
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ApiProperty({ example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column()
  lastName: string;

  @ApiProperty({ enum: UserRole, default: UserRole.HABITANT })
  @Column({ default: UserRole.HABITANT })
  role: UserRole;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @Column({ type: 'string', nullable: true })
  neighbourhoodId: string;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  points: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ enum: UserLang, default: UserLang.FR })
  @Column({ default: UserLang.FR })
  lang: UserLang;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
