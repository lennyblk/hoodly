import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { QueryLangService } from './query-lang.service';
import { Document } from '../entities/mongodb/Document';
import { Announcement } from '../entities/mongodb/Announcement';
import { Event } from '../entities/mongodb/Event';
import { Message } from '../entities/mongodb/Message';
import { Vote } from '../entities/mongodb/Vote';

describe('QueryLangService', () => {
  let service: QueryLangService;

  const mockFind = jest.fn().mockResolvedValue([]);
  const makeMockRepo = () => ({ find: mockFind });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryLangService,
        { provide: getRepositoryToken(Document, 'mongodb'), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Announcement, 'mongodb'), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Event, 'mongodb'), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Message, 'mongodb'), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Vote, 'mongodb'), useValue: makeMockRepo() },
      ],
    }).compile();

    service = module.get<QueryLangService>(QueryLangService);
    jest.clearAllMocks();
  });

  it('throws on empty query', async () => {
    await expect(service.execute('')).rejects.toThrow(BadRequestException);
  });

  it('throws on unknown collection', async () => {
    await expect(service.execute('FIND foobar')).rejects.toThrow(BadRequestException);
  });

  it('executes simple FIND query', async () => {
    mockFind.mockResolvedValue([{ title: 'Test' }]);

    const result = await service.execute('FIND documents');
    expect(result.collection).toBe('documents');
    expect(result.count).toBe(1);
    expect(result.results).toHaveLength(1);
  });

  it('executes FIND with WHERE clause', async () => {
    mockFind.mockResolvedValue([]);

    const result = await service.execute('FIND announcements WHERE status = "open"');
    expect(result.collection).toBe('announcements');
    expect(result.filter).toEqual({ status: 'open' });
  });

  it('executes FIND with LIMIT', async () => {
    mockFind.mockResolvedValue([]);

    const result = await service.execute('FIND events LIMIT 5');
    expect(result.collection).toBe('events');
  });
});
