import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Event } from '../../entities/mongodb/Event';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event, 'mongodb')
    private eventsRepository: MongoRepository<Event>,
    @InjectRepository(Neighbourhood, 'mongodb')
    private neighbourhoodsRepository: MongoRepository<Neighbourhood>,
  ) {}

  async findAll(neighbourhoodId?: string) {
    if (neighbourhoodId) {
      return this.eventsRepository.find({ where: { neighbourhoodId } as any });
    }
    return this.eventsRepository.find();
  }

  async findOne(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new BadRequestException('Invalid ID format');
    }
    const event = await this.eventsRepository.findOneBy({ _id: objectId } as any);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  private async validateNeighbourhood(neighbourhoodId: string) {
    let nid: ObjectId;
    try {
      nid = new ObjectId(neighbourhoodId);
    } catch {
      throw new BadRequestException('Invalid format for Neighbourhood ID');
    }
    const neighbourhood = await this.neighbourhoodsRepository.findOneBy({ _id: nid } as any);
    if (!neighbourhood) {
      throw new BadRequestException(`Neighbourhood with id ${neighbourhoodId} does not exist`);
    }
  }

  async create(dto: CreateEventDto) {
    await this.validateNeighbourhood(dto.neighbourhoodId);
    const event = this.eventsRepository.create({
      ...dto,
      date: new Date(dto.date),
      participants: [],
      interestUsers: [],
    });
    return this.eventsRepository.save(event);
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.findOne(id);
    Object.assign(event, {
      ...dto,
      ...(dto.date && { date: new Date(dto.date) }),
    });
    return this.eventsRepository.save(event);
  }

  async remove(id: string) {
    const event = await this.findOne(id);
    return this.eventsRepository.remove(event);
  }

  async rsvp(id: string, userId: string) {
    const event = await this.findOne(id);
    if (!event.participants) event.participants = [];
    const idx = event.participants.indexOf(userId);
    if (idx === -1) {
      event.participants.push(userId);
    } else {
      event.participants.splice(idx, 1);
    }
    return this.eventsRepository.save(event);
  }

  async interest(id: string, userId: string) {
    const event = await this.findOne(id);
    if (!event.interestUsers) event.interestUsers = [];
    const idx = event.interestUsers.indexOf(userId);
    if (idx === -1) {
      event.interestUsers.push(userId);
    } else {
      event.interestUsers.splice(idx, 1);
    }
    return this.eventsRepository.save(event);
  }
}
