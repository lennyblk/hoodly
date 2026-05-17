import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { Vote } from '../../entities/mongodb/Vote';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Neighbourhood], 'mongodb'),
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
