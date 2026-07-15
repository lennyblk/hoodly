import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Announcement } from '../../entities/mongodb/Announcement';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { Vote } from '../../entities/mongodb/Vote';
import { Event } from '../../entities/mongodb/Event';
import { Document } from '../../entities/mongodb/Document';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnnouncementsCron } from './announcements.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, Neighbourhood, Vote, Event, Document], 'mongodb'),
    UsersModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, AnnouncementsCron, RolesGuard],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
