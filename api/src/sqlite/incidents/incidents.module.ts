import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { Incident } from '../../entities/sqlite/Incident';
import { UsersModule } from '../../mongodb/users/users.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident], 'sqlite'),
    UsersModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, RolesGuard],
  exports: [IncidentsService],
})
export class IncidentsModule {}
