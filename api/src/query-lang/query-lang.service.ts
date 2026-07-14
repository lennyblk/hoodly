import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Document } from '../entities/mongodb/Document';
import { hqlConditionToMongoFilter, parseHql } from './hoodly-query.parser';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export interface QueryResult {
  collection: 'documents';
  filter: Record<string, unknown>;
  count: number;
  results: Document[];
  tookMs: number;
}

@Injectable()
export class QueryLangService {
  constructor(
    @InjectRepository(Document, 'mongodb')
    private readonly documentsRepository: MongoRepository<Document>,
  ) {}

  async execute(query: string): Promise<QueryResult> {
    const { where, limit } = parseHql(query);

    const filter = hqlConditionToMongoFilter(where);
    const take = Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const start = Date.now();
    const results = await this.documentsRepository.find({ where: filter as any, take });

    return {
      collection: 'documents',
      filter,
      count: results.length,
      results,
      tookMs: Date.now() - start,
    };
  }
}
