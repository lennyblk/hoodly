import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  HABITANT = 'habitant',
  MODERATEUR = 'moderateur',
  ADMIN = 'admin',
}

@Entity('users')
export class UserSqlite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @ApiProperty({ enum: UserRole, default: UserRole.HABITANT })
  @Column({ type: 'text', enum: UserRole, default: UserRole.HABITANT })
  role: UserRole;
    
  @Column({ nullable: true })
  neighbourhoodId: string;

  @Column({ type: 'datetime', nullable: true })
  syncedAt: Date | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true, unique: true })
  mongoId: string | null;
}
