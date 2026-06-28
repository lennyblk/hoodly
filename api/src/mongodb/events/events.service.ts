import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Event } from '../../entities/mongodb/Event';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Neo4jService } from '../../neo4j/neo4j.service';
import { PointsService } from '../users/points.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event, 'mongodb')
    private eventsRepository: MongoRepository<Event>,
    @InjectRepository(Neighbourhood, 'mongodb')
    private neighbourhoodsRepository: MongoRepository<Neighbourhood>,
    private neo4jService: Neo4jService,
    private pointsService: PointsService,
  ) { }

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
      await this.pointsService.addPoints(userId, 5).catch(() => {});
      await this.neo4jService.run(
        `MERGE (u:User {id: $userId})
         MERGE (e:Event {id: $eventId})
         ON CREATE SET e.neighbourhoodId = $neighbourhoodId
         MERGE (u)-[:ATTENDED]->(e)`,
        { userId, eventId: id, neighbourhoodId: event.neighbourhoodId },
      ).catch(() => { });
    } else {
      event.participants.splice(idx, 1);
      await this.neo4jService.run(
        `MATCH (u:User {id: $userId})-[r:ATTENDED]->(e:Event {id: $eventId}) DELETE r`,
        { userId, eventId: id },
      ).catch(() => { });
    }
    return this.eventsRepository.save(event);
  }

  async interest(id: string, userId: string) {
    const event = await this.findOne(id);
    if (!event.interestUsers) event.interestUsers = [];
    const idx = event.interestUsers.indexOf(userId);
    if (idx === -1) {
      event.interestUsers.push(userId);
      await this.neo4jService.run(
        `MERGE (u:User {id: $userId})
         MERGE (e:Event {id: $eventId})
         ON CREATE SET e.neighbourhoodId = $neighbourhoodId
         MERGE (u)-[:INTERESTED_IN]->(e)`,
        { userId, eventId: id, neighbourhoodId: event.neighbourhoodId },
      ).catch(() => {});
    } else {
      event.interestUsers.splice(idx, 1);
      await this.neo4jService.run(
        `MATCH (u:User {id: $userId})-[r:INTERESTED_IN]->(e:Event {id: $eventId}) DELETE r`,
        { userId, eventId: id },
      ).catch(() => {});
    }
    return this.eventsRepository.save(event);
  }

  async getRecommendations(userId: string, neighbourhoodId: string): Promise<string[]> {
    const result = await this.neo4jService.run(
      `MATCH (me:User {id: $userId})-[:INTERESTED_IN|ATTENDED]->(pivot:Event)
       MATCH (other:User)-[:INTERESTED_IN|ATTENDED]->(pivot)
       WHERE other.id <> $userId
       WITH DISTINCT other
       MATCH (other)-[:INTERESTED_IN|ATTENDED]->(rec:Event {neighbourhoodId: $neighbourhoodId})
       WHERE NOT (me)-[:INTERESTED_IN|ATTENDED]->(rec)
       RETURN rec.id AS eventId, count(*) AS score
       ORDER BY score DESC
       LIMIT 5`,
      { userId, neighbourhoodId },
    );
    return result.records.map((r) => r.get('eventId') as string);
  }
}
