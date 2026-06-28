import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryLangService } from './query-lang.service';
import { QueryLangController } from './query-lang.controller';
import { RolesGuard } from '../common/guards/roles.guard';
import { Document } from '../entities/mongodb/Document';
import { Announcement } from '../entities/mongodb/Announcement';
import { Event } from '../entities/mongodb/Event';
import { Message } from '../entities/mongodb/Message';
import { Vote } from '../entities/mongodb/Vote';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, Announcement, Event, Message, Vote], 'mongodb'),
  ],
  controllers: [QueryLangController],
  providers: [QueryLangService, RolesGuard],
  exports: [QueryLangService],
})
export class QueryLangModule {}
