import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Vote } from '../../entities/mongodb/Vote';
import { Event } from '../../entities/mongodb/Event';
import { PointsService } from '../users/points.service';

@Injectable()
export class AnnouncementsCron {
  constructor(
    @InjectRepository(Vote, 'mongodb')
    private votesRepository: MongoRepository<Vote>,
    @InjectRepository(Event, 'mongodb')
    private eventsRepository: MongoRepository<Event>,
    private pointsService: PointsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDaily() {
    await this.rewardVoters();
    await this.rewardEventParticipants();
  }

  private async rewardVoters() {
    const now = new Date();
    const votes = await this.votesRepository.find({
      where: { pointsRewarded: { $ne: true } } as any,
    });

    for (const vote of votes) {
      if (new Date(vote.endsAt) > now) continue;

      const voterIds = new Set<string>();
      for (const result of vote.results ?? []) {
        for (const uid of result.userIds ?? []) {
          voterIds.add(uid.toString());
        }
      }

      for (const userId of voterIds) {
        await this.pointsService.addPoints(userId, 3, 'Participation à un vote').catch(() => {});
      }

      vote.pointsRewarded = true;
      await this.votesRepository.save(vote);
      console.log(`[Cron] Vote ${vote.id}: +3pts to ${voterIds.size} voters`);
    }
  }

  private async rewardEventParticipants() {
    const now = new Date();
    const events = await this.eventsRepository.find({
      where: { pointsRewarded: { $ne: true } } as any,
    });

    for (const event of events) {
      if (new Date(event.date) > now) continue;

      for (const userId of event.participants ?? []) {
        await this.pointsService.addPoints(userId, 5, 'Participation à un événement').catch(() => {});
      }

      event.pointsRewarded = true;
      await this.eventsRepository.save(event);
      console.log(`[Cron] Event ${event.id}: +5pts to ${(event.participants ?? []).length} participants`);
    }
  }
}
