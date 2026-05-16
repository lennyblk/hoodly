import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../../entities/mongodb/Event';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Neighbourhood], 'mongodb'),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
