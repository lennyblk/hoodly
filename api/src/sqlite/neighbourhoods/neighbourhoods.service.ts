import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeighbourhoodSqlite } from '../../entities/sqlite/NeighbourhoodSqlite';
import { CreateNeighbourhoodSqliteDto } from './dto/create-neighbourhood.dto';
import { UpdateNeighbourhoodSqliteDto } from './dto/update-neighbourhood.dto';

@Injectable()
export class NeighbourhoodsSqliteService {
  constructor(
    @InjectRepository(NeighbourhoodSqlite, 'sqlite')
    private readonly neighbourhoodsRepository: Repository<NeighbourhoodSqlite>,
  ) {}

  create(createNeighbourhoodDto: CreateNeighbourhoodSqliteDto) {
  const neighbourhood = this.neighbourhoodsRepository.create(createNeighbourhoodDto);
  return this.neighbourhoodsRepository.save(neighbourhood);
}

  findAll() {
    return this.neighbourhoodsRepository.find();
  }

  findOne(id: string) {
    return this.neighbourhoodsRepository.findOneBy({ id });
  }

  update(id: string, updateNeighbourhoodDto: UpdateNeighbourhoodSqliteDto) {
    return this.neighbourhoodsRepository.update(id, updateNeighbourhoodDto);
  }

  remove(id: string) {
    return this.neighbourhoodsRepository.delete(id);
  }
}