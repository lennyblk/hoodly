import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { EventsService } from './events.service';
import { Event, EventType } from '../../entities/mongodb/Event';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { Neo4jService } from '../../neo4j/neo4j.service';
import { PointsService } from '../users/points.service';

const VALID_ID = new ObjectId().toHexString();
const USER_ID = new ObjectId().toHexString();
const NEIGHBOURHOOD_ID = new ObjectId().toHexString();

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: new ObjectId(VALID_ID),
    title: 'Soiree',
    description: 'Une soiree',
    type: EventType.OTHER,
    organizerId: USER_ID,
    neighbourhoodId: NEIGHBOURHOOD_ID,
    date: new Date(),
    participants: [],
    interestUsers: [],
    createdAt: new Date(),
    ...overrides,
  } as Event;
}

describe('EventsService', () => {
  let service: EventsService;

  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockNeighbourhoodRepo = { findOneBy: jest.fn() };
  const mockNeo4jService = { run: jest.fn().mockResolvedValue({ records: [] }) };
  const mockPointsService = { addPoints: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event, 'mongodb'), useValue: mockRepo },
        { provide: getRepositoryToken(Neighbourhood, 'mongodb'), useValue: mockNeighbourhoodRepo },
        { provide: Neo4jService, useValue: mockNeo4jService },
        { provide: PointsService, useValue: mockPointsService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('throws BadRequestException on invalid id', async () => {
      await expect(service.findOne('bad')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(VALID_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rsvp', () => {
    it('adds user to participants on first rsvp', async () => {
      const event = makeEvent();
      mockRepo.findOneBy.mockResolvedValue(event);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.rsvp(VALID_ID, USER_ID);
      expect(result.participants).toContain(USER_ID);
      expect(mockPointsService.addPoints).toHaveBeenCalledWith(USER_ID, 5);
    });

    it('removes user from participants on second rsvp (toggle)', async () => {
      const event = makeEvent({ participants: [USER_ID] });
      mockRepo.findOneBy.mockResolvedValue(event);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.rsvp(VALID_ID, USER_ID);
      expect(result.participants).not.toContain(USER_ID);
    });
  });

  describe('interest', () => {
    it('adds user to interestUsers', async () => {
      const event = makeEvent();
      mockRepo.findOneBy.mockResolvedValue(event);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.interest(VALID_ID, USER_ID);
      expect(result.interestUsers).toContain(USER_ID);
    });

    it('removes user on second call (toggle)', async () => {
      const event = makeEvent({ interestUsers: [USER_ID] });
      mockRepo.findOneBy.mockResolvedValue(event);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.interest(VALID_ID, USER_ID);
      expect(result.interestUsers).not.toContain(USER_ID);
    });
  });
});
