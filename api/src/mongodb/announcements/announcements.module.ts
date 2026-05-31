import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { Announcement } from '../../entities/mongodb/Announcement';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, Neighbourhood], 'mongodb'),
    UsersModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService, RolesGuard],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
