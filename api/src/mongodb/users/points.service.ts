import { BadRequestException, Injectable } from '@nestjs/common';
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

    if (amount < 0) {
      const user = await this.usersRepository.findOneBy({ _id: objectId });
      if (!user || user.points + amount < 0) {
        throw new BadRequestException('Solde de points insuffisant');
      }
    }

    await this.usersRepository.updateOne(
      { _id: objectId },
      { $inc: { points: amount } },
    );
  }
}
