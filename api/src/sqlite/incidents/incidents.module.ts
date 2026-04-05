import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident } from '../../entities/sqlite/Incident';
import { UsersModule } from '../../mongodb/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident], 'sqlite'),
    UsersModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
