import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Announcement, AnnouncementStatus, AnnouncementType } from '../../entities/mongodb/Announcement';
import { Vote } from '../../entities/mongodb/Vote';
import { Event } from '../../entities/mongodb/Event';
import { PointsService } from '../users/points.service';

@Injectable()
export class AnnouncementsCron {
  constructor(
    @InjectRepository(Announcement, 'mongodb')
    private announcementsRepository: MongoRepository<Announcement>,
    @InjectRepository(Vote, 'mongodb')
    private votesRepository: MongoRepository<Vote>,
    @InjectRepository(Event, 'mongodb')
    private eventsRepository: MongoRepository<Event>,
    private pointsService: PointsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDaily() {
    await this.transferServicePoints();
    await this.rewardVoters();
    await this.rewardEventParticipants();
  }

  private async transferServicePoints() {
    const today = new Date().toISOString().split('T')[0];
    const announcements = await this.announcementsRepository.find({
      where: { status: AnnouncementStatus.ACCEPTED } as any,
    });

    for (const ann of announcements) {
      const serviceDate = ann.serviceDetails?.chosenDate;
      if (!serviceDate || serviceDate !== today) continue;
      if (!ann.points || !ann.acceptedBy) continue;

      let payerId: string;
      let providerId: string;
      if (ann.type === AnnouncementType.OFFER) {
        payerId = ann.acceptedBy;
        providerId = ann.authorId;
      } else {
        payerId = ann.authorId;
        providerId = ann.acceptedBy;
      }

      try {
        await this.pointsService.addPoints(payerId, -ann.points);
        await this.pointsService.addPoints(providerId, ann.points);
        ann.status = AnnouncementStatus.DONE;
        await this.announcementsRepository.save(ann);
        console.log(`[Cron] Service points: ${ann.points}pts ${payerId} -> ${providerId}`);
      } catch (e: any) {
        console.warn(`[Cron] Service transfer failed ${ann.id}: ${e.message}`);
      }
    }
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
        await this.pointsService.addPoints(userId, 3).catch(() => {});
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
        await this.pointsService.addPoints(userId, 5).catch(() => {});
      }

      event.pointsRewarded = true;
      await this.eventsRepository.save(event);
      console.log(`[Cron] Event ${event.id}: +5pts to ${(event.participants ?? []).length} participants`);
    }
  }
}
