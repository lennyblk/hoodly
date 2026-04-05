import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSqlite, UserRole } from '../../entities/sqlite/UserSqlite';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(UserSqlite, 'sqlite')
    private readonly usersRepository: Repository<UserSqlite>,
  ) {}

  async syncFromMongo(mongoUser: {
    _id: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    neighbourhoodId?: string;
  }) {
    const existing = await this.usersRepository.findOneBy({ mongoId: mongoUser._id });

    const data = {
      email: mongoUser.email,
      password: mongoUser.password,
      firstName: mongoUser.firstName,
      lastName: mongoUser.lastName,
      role: mongoUser.role || UserRole.HABITANT,
      neighbourhoodId: mongoUser.neighbourhoodId,
      mongoId: mongoUser._id,
      syncedAt: new Date(),
    };

    if (existing) {
      await this.usersRepository.update(existing.id, data);
      return this.usersRepository.findOneBy({ id: existing.id });
    }

    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }
}