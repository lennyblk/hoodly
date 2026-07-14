
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PointsService } from './points.service';
import { User } from '../../entities/mongodb/User';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Neighbourhood], 'mongodb')],
  controllers: [UsersController],
  providers: [UsersService, PointsService, RolesGuard],
  exports: [UsersService, PointsService],
})
export class UsersModule { }
