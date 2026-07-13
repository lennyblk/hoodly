import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { DocumentsService } from './documents.service';
import { Document, DocumentStatus, DocumentType } from '../../entities/mongodb/Document';
import { Announcement } from '../../entities/mongodb/Announcement';
import { UsersService } from '../users/users.service';
import { PointsService } from '../users/points.service';

const VALID_ID = new ObjectId().toHexString();
const OWNER_ID = new ObjectId().toHexString();

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: new ObjectId(VALID_ID),
    title: 'Contrat test',
    type: DocumentType.CONTRACT,
    name: 'contrat.pdf',
    ownerId: OWNER_ID,
    signers: [],
    signatures: [],
    status: DocumentStatus.DRAFT,
    signatureZones: [],
    gridfsId: null as any,
    announcementId: null as any,
    createdAt: new Date(),
    ...overrides,
  } as Document;
}

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockDocRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockAnnouncementRepo = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    driver: {
      queryRunner: {
        databaseConnection: {
          db: () => ({
            collection: () => ({
              find: () => ({ toArray: () => Promise.resolve([]) }),
            }),
          }),
        },
      },
    },
  };

  const mockJwtService = { verifyAsync: jest.fn() };
  const mockUsersService = { findOne: jest.fn() };
  const mockPointsService = { addPoints: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(Document, 'mongodb'), useValue: mockDocRepo },
        { provide: getRepositoryToken(Announcement, 'mongodb'), useValue: mockAnnouncementRepo },
        { provide: getDataSourceToken('mongodb'), useValue: mockDataSource },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PointsService, useValue: mockPointsService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('throws BadRequestException on invalid id', async () => {
      await expect(service.findOne('invalid')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when not found', async () => {
      mockDocRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(VALID_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns document when found', async () => {
      const doc = makeDocument();
      mockDocRepo.findOneBy.mockResolvedValue(doc);
      await expect(service.findOne(VALID_ID)).resolves.toBe(doc);
    });
  });

  describe('findAll', () => {
    it('returns all documents', async () => {
      mockDocRepo.find.mockResolvedValue([makeDocument()]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('filters by userId (owner or signer)', async () => {
      mockDocRepo.find.mockResolvedValue([]);
      await service.findAll(OWNER_ID);
      expect(mockDocRepo.find).toHaveBeenCalledWith({
        where: { $or: [{ ownerId: OWNER_ID }, { signers: OWNER_ID }] },
      });
    });
  });
});
