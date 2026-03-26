import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { CreateNeighbourhoodDto } from './dto/create-neighbourhood.dto';
import { UpdateNeighbourhoodDto } from './dto/update-neighbourhood.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class NeighbourhoodsService {
  constructor(
    @InjectRepository(Neighbourhood, 'mongodb')
    private neighbourhoodsRepository: MongoRepository<Neighbourhood>,
    private usersService: UsersService,
  ) {}

  async findAll() {
    return this.neighbourhoodsRepository.find();
  }

  async findOne(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      throw new BadRequestException('Invalid format for Neighbourhood ID');
    }

    const neighbourhood = await this.neighbourhoodsRepository.findOneBy({ _id: objectId });
    if (!neighbourhood) {
      throw new NotFoundException(`Neighbourhood with id ${id} not found`);
    }
    return neighbourhood;
  }

  private async validateReferences(createdBy?: string) {
    if (createdBy) {
      try {
        await this.usersService.findOne(createdBy);
      } catch (e) {
        throw new BadRequestException(`User with id ${createdBy} does not exist`);
      }
    }
  }

  async create(createNeighbourhoodDto: CreateNeighbourhoodDto) {
    await this.validateReferences(createNeighbourhoodDto.createdBy);

    const neighbourhood = this.neighbourhoodsRepository.create(createNeighbourhoodDto as any);
    return this.neighbourhoodsRepository.save(neighbourhood);
  }

  async update(id: string, updateNeighbourhoodDto: UpdateNeighbourhoodDto) {
    const neighbourhood = await this.findOne(id);
    
    await this.validateReferences(updateNeighbourhoodDto.createdBy);

    Object.assign(neighbourhood, updateNeighbourhoodDto);
    return this.neighbourhoodsRepository.save(neighbourhood);
  }

  async remove(id: string) {
    const neighbourhood = await this.findOne(id);
    return this.neighbourhoodsRepository.remove(neighbourhood);
  }
}
