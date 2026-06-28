import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Document } from '../entities/mongodb/Document';
import { Announcement } from '../entities/mongodb/Announcement';
import { Event } from '../entities/mongodb/Event';
import { Message } from '../entities/mongodb/Message';
import { Vote } from '../entities/mongodb/Vote';
import { hqlConditionToMongoFilter, parseHql } from './hoodly-query.parser';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export interface QueryResult {
  collection: string;
  filter: Record<string, unknown>;
  count: number;
  results: unknown[];
  tookMs: number;
}

@Injectable()
export class QueryLangService {
  private readonly repositories: Record<string, MongoRepository<any>>;

  constructor(
    @InjectRepository(Document, 'mongodb') documentsRepository: MongoRepository<Document>,
    @InjectRepository(Announcement, 'mongodb') announcementsRepository: MongoRepository<Announcement>,
    @InjectRepository(Event, 'mongodb') eventsRepository: MongoRepository<Event>,
    @InjectRepository(Message, 'mongodb') messagesRepository: MongoRepository<Message>,
    @InjectRepository(Vote, 'mongodb') votesRepository: MongoRepository<Vote>,
  ) {
    this.repositories = {
      documents: documentsRepository,
      announcements: announcementsRepository,
      events: eventsRepository,
      messages: messagesRepository,
      votes: votesRepository,
    };
  }

  async execute(query: string): Promise<QueryResult> {
    const { collection, where, limit } = parseHql(query);

    const repository = this.repositories[collection];
    if (!repository) {
      throw new BadRequestException(
        `Unknown collection "${collection}". Allowed: ${Object.keys(this.repositories).join(', ')}`,
      );
    }

    const filter = hqlConditionToMongoFilter(where);
    const take = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const start = Date.now();
    const results = await repository.find({ where: filter as any, take });

    return {
      collection,
      filter,
      count: results.length,
      results,
      tookMs: Date.now() - start,
    };
  }
}
