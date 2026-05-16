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
    const event = await this.eventsRepository.findOneBy({ id: objectId } as any);
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
    if (!event.participants.includes(userId)) {
      event.participants.push(userId);
      return this.eventsRepository.save(event);
    }
    return event;
  }

  async interest(id: string, userId: string) {
    const event = await this.findOne(id);
    if (!event.interestUsers) event.interestUsers = [];
    if (!event.interestUsers.includes(userId)) {
      event.interestUsers.push(userId);
      return this.eventsRepository.save(event);
    }
    return event;
  }
}
