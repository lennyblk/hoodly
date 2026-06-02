import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User } from '../../entities/mongodb/User';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(User, 'mongodb')
    private usersRepository: MongoRepository<User>,
  ) {}

  async addPoints(userId: string, amount: number): Promise<void> {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch {
      return;
    }
    await this.usersRepository.updateOne(
      { _id: objectId },
      { $inc: { points: amount } },
    );
  }
}
