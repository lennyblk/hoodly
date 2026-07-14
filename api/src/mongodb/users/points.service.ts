import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { User } from '../../entities/mongodb/User';
import { PointsTransaction } from '../../entities/mongodb/PointsTransaction';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(User, 'mongodb')
    private usersRepository: MongoRepository<User>,
    @InjectRepository(PointsTransaction, 'mongodb')
    private transactionsRepository: MongoRepository<PointsTransaction>,
  ) {}

  async addPoints(userId: string, amount: number, reason: string): Promise<void> {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch {
      return;
    }

    const user = await this.usersRepository.findOneBy({ _id: objectId });
    if (!user) return;

    if (amount < 0 && user.points + amount < 0) {
      throw new BadRequestException('Solde de points insuffisant');
    }

    await this.usersRepository.updateOne(
      { _id: objectId },
      { $inc: { points: amount } },
    );

    await this.transactionsRepository.save(
      this.transactionsRepository.create({
        userId,
        amount,
        reason,
        balanceAfter: user.points + amount,
      }),
    );
  }

  async logInitialBonus(userId: string, amount: number, reason: string): Promise<void> {
    await this.transactionsRepository.save(
      this.transactionsRepository.create({ userId, amount, reason, balanceAfter: amount }),
    );
  }

  async getHistory(userId: string): Promise<PointsTransaction[]> {
    return this.transactionsRepository.find({
      where: { userId } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }
}
