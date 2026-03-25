import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('users')
export class UserSqlite {
  @PrimaryColumn()
  id: string; // synced from MongoDB ObjectId

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  neighborhoodId: string;

  @Column({ nullable: true })
  syncedAt: Date;
}
