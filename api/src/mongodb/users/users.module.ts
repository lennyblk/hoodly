
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PointsService } from './points.service';
import { User } from '../../entities/mongodb/User';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { PointsTransaction } from '../../entities/mongodb/PointsTransaction';
import { Announcement } from '../../entities/mongodb/Announcement';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Neighbourhood, PointsTransaction, Announcement], 'mongodb'),
    JwtModule.register({}),
  ],
  controllers: [UsersController],
  providers: [UsersService, PointsService, RolesGuard],
  exports: [UsersService, PointsService],
})
export class UsersModule { }
