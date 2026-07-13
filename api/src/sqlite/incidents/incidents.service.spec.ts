import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentStatus } from '../../entities/sqlite/Incident';
import { UsersService } from '../../mongodb/users/users.service';

const VALID_ID = 'uuid-123';
const USER_ID = 'user-456';

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: VALID_ID,
    title: 'Lampadaire casse',
    description: 'Le lampadaire ne fonctionne plus',
    category: 'voirie',
    status: IncidentStatus.OPEN,
    reportedBy: USER_ID,
    neighborhoodId: 'nid-1',
    reportedAt: new Date(),
    syncedAt: null,
    isDirty: 0,
    ...overrides,
  } as Incident;
}

describe('IncidentsService', () => {
  let service: IncidentsService;

  const mockRepo = {
    find: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn().mockResolvedValue({ _id: USER_ID }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: getRepositoryToken(Incident, 'sqlite'), useValue: mockRepo },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('throws NotFoundException when not found', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });

    it('returns incident when found', async () => {
      const incident = makeIncident();
      mockRepo.findOneBy.mockResolvedValue(incident);
      await expect(service.findOne(VALID_ID)).resolves.toBe(incident);
    });
  });

  describe('findByNeighbourhood', () => {
    it('queries by neighborhoodId', async () => {
      mockRepo.findBy.mockResolvedValue([makeIncident()]);
      const result = await service.findByNeighbourhood('nid-1');
      expect(mockRepo.findBy).toHaveBeenCalledWith({ neighborhoodId: 'nid-1' });
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('creates incident with generated id', async () => {
      const dto = {
        title: 'Test',
        description: 'Desc',
        category: 'voirie',
        reportedBy: USER_ID,
        neighborhoodId: 'nid-1',
      };
      mockRepo.create.mockImplementation((d) => d);
      mockRepo.save.mockImplementation((d) => Promise.resolve(d));

      const result = await service.create(dto as any);
      expect(result.id).toBeDefined();
      expect(mockUsersService.findOne).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException if incident does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });

    it('removes existing incident', async () => {
      const incident = makeIncident();
      mockRepo.findOneBy.mockResolvedValue(incident);
      mockRepo.remove.mockResolvedValue(incident);

      const result = await service.remove(VALID_ID);
      expect(mockRepo.remove).toHaveBeenCalledWith(incident);
    });
  });
});
