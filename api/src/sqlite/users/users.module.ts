import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSqlite } from '../../entities/sqlite/UserSqlite';
import { User } from '../../entities/mongodb/User';
import { UsersSqliteService } from './users.service';
import { UsersSqliteController } from './users.controller';
import { SyncService } from './sync.service';

class SyncProvider implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User, 'mongodb') private mongoRepo: Repository<User>,
    @InjectRepository(UserSqlite, 'sqlite') private sqliteRepo: Repository<UserSqlite>,
  ) {}

  async onApplicationBootstrap() {
    console.log('Starting user sync from MongoDB to SQLite...');
    try {
      const mongoUsers = await this.mongoRepo.find();
      for (const mongoUser of mongoUsers) {
        const existing = await this.sqliteRepo.findOneBy({ mongoId: mongoUser._id.toString() });
        const data = {
          email: mongoUser.email,
          password: mongoUser.password,
          firstName: mongoUser.firstName,
          lastName: mongoUser.lastName,
          role: mongoUser.role || 'habitant',
          neighbourhoodId: mongoUser.neighbourhoodId,
          mongoId: mongoUser._id.toString(),
          syncedAt: new Date(),
        };
        if (existing) {
          await this.sqliteRepo.update(existing.id, data);
        } else {
          const user = this.sqliteRepo.create(data);
          await this.sqliteRepo.save(user);
        }
      }
      console.log('User sync completed.');
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSqlite], 'sqlite'),
    TypeOrmModule.forFeature([User], 'mongodb'),
  ],
  controllers: [UsersSqliteController],
  providers: [UsersSqliteService, SyncService, SyncProvider],
  exports: [UsersSqliteService, SyncService],
})
export class UsersSqliteModule {}