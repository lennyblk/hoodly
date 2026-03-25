import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn } from 'typeorm';

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
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: UserRole.HABITANT })
  role: UserRole;

  @Column({ type: 'string', nullable: true })
  neighbourhoodId: string;

  @Column({ default: 0 })
  points: number;

  @Column({ nullable: true })
  mfaSecret: string;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: UserLang.FR })
  lang: UserLang;

  @CreateDateColumn()
  createdAt: Date;
}
