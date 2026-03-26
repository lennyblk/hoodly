import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NeighbourhoodsService } from './neighbourhoods.service';
import { NeighbourhoodsController } from './neighbourhoods.controller';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Neighbourhood], 'mongodb'),
    UsersModule,
  ],
  controllers: [NeighbourhoodsController],
  providers: [NeighbourhoodsService],
  exports: [NeighbourhoodsService],
})
export class NeighbourhoodsModule {}
