import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { AnnouncementsService } from './announcements.service';
import { Announcement, AnnouncementType, AnnouncementStatus } from '../../entities/mongodb/Announcement';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { UsersService } from '../users/users.service';
import { Neo4jService } from '../../neo4j/neo4j.service';

const VALID_ID = new ObjectId().toHexString();
const AUTHOR_ID = new ObjectId().toHexString();
const ACCEPTER_ID = new ObjectId().toHexString();
const NEIGHBOURHOOD_ID = new ObjectId().toHexString();

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: new ObjectId(VALID_ID),
    authorId: AUTHOR_ID,
    neighbourhoodId: NEIGHBOURHOOD_ID,
    title: 'Tonte de pelouse',
    description: 'Je propose de tondre.',
    type: AnnouncementType.OFFER,
    isPaid: false,
    points: 10,
    status: AnnouncementStatus.OPEN,
    acceptedBy: null as any,
    contractId: null as any,
    availabilities: [],
    serviceDetails: null as any,
    createdAt: new Date(),
    ...overrides,
  } as Announcement;
}

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  const mockRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockNeighbourhoodRepo = { findOneBy: jest.fn() };
  const mockUsersService = { findOne: jest.fn() };
  const mockNeo4jService = { run: jest.fn().mockResolvedValue({ records: [] }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: getRepositoryToken(Announcement, 'mongodb'), useValue: mockRepo },
        { provide: getRepositoryToken(Neighbourhood, 'mongodb'), useValue: mockNeighbourhoodRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: Neo4jService, useValue: mockNeo4jService },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('throws BadRequestException on invalid id', async () => {
      await expect(service.findOne('invalid')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(VALID_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns announcement when found', async () => {
      const ann = makeAnnouncement();
      mockRepo.findOneBy.mockResolvedValue(ann);
      await expect(service.findOne(VALID_ID)).resolves.toBe(ann);
    });
  });

  describe('accept', () => {
    it('throws if author tries to accept own announcement', async () => {
      mockRepo.findOneBy.mockResolvedValue(makeAnnouncement());
      await expect(service.accept(VALID_ID, AUTHOR_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws if announcement is not open', async () => {
      mockRepo.findOneBy.mockResolvedValue(makeAnnouncement({ status: AnnouncementStatus.ACCEPTED }));
      await expect(service.accept(VALID_ID, ACCEPTER_ID)).rejects.toThrow(BadRequestException);
    });

    it('accepts and sets acceptedBy', async () => {
      const ann = makeAnnouncement();
      mockRepo.findOneBy.mockResolvedValue(ann);
      mockRepo.save.mockImplementation((a) => Promise.resolve(a));

      const result = await service.accept(VALID_ID, ACCEPTER_ID);
      expect(result.acceptedBy).toBe(ACCEPTER_ID);
      expect(result.status).toBe('accepted');
    });
  });
});
