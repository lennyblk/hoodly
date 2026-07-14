import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Announcement, AnnouncementStatus, AnnouncementType } from '../../entities/mongodb/Announcement';
import { PointsService } from '../users/points.service';

@Injectable()
export class AnnouncementsCron {
  constructor(
    @InjectRepository(Announcement, 'mongodb')
    private announcementsRepository: MongoRepository<Announcement>,
    private pointsService: PointsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyPointTransfers() {
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
        console.log(`[Cron] Points transferred for announcement ${ann.id}: ${ann.points}pts ${payerId} -> ${providerId}`);
      } catch (e: any) {
        console.warn(`[Cron] Transfer failed for announcement ${ann.id}: ${e.message}`);
      }
    }
  }
}
