import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeighbourhoodSqlite } from '../../entities/sqlite/NeighbourhoodSqlite';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { NeighbourhoodsSqliteService } from './neighbourhoods.service';
import { NeighbourhoodsSqliteController } from './neighbourhoods.controller';

class SyncProvider implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Neighbourhood, 'mongodb') private mongoRepo: Repository<Neighbourhood>,
    @InjectRepository(NeighbourhoodSqlite, 'sqlite') private sqliteRepo: Repository<NeighbourhoodSqlite>,
  ) {}

  async onApplicationBootstrap() {
    console.log('Starting neighbourhood sync from MongoDB to SQLite...');
    try {
      const mongoNeighbourhoods = await this.mongoRepo.find();
      for (const mongoNeighbourhood of mongoNeighbourhoods) {
        const existing = await this.sqliteRepo.findOneBy({ id: mongoNeighbourhood.id.toString() });
        const data = {
        id: mongoNeighbourhood.id.toString(),
        name: mongoNeighbourhood.name,
        geometry: mongoNeighbourhood.geometry,
        createdBy: mongoNeighbourhood.createdBy,
        createdAt: mongoNeighbourhood.createdAt,
        syncedAt: new Date(),
        };
        if (existing) {
          await this.sqliteRepo.update(existing.id, data);
        } else {
          const neighbourhood = this.sqliteRepo.create(data);
          await this.sqliteRepo.save(neighbourhood);
        }
      }
      console.log('Neighbourhood sync completed.');
    } catch (error) {
      console.error('Error during neighbourhood sync:', error);
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([NeighbourhoodSqlite], 'sqlite'),
    TypeOrmModule.forFeature([Neighbourhood], 'mongodb'),
  ],
  controllers: [NeighbourhoodsSqliteController],
  providers: [NeighbourhoodsSqliteService, SyncProvider],
  exports: [NeighbourhoodsSqliteService],
})
export class NeighbourhoodsSqliteModule {}