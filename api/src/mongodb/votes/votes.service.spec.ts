import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { VotesService } from './votes.service';
import { Vote, VoteType } from '../../entities/mongodb/Vote';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';

const VALID_NID = new ObjectId().toHexString();
const VALID_VID = new ObjectId().toHexString();
const USER_ID = new ObjectId().toHexString();

function makeVote(overrides: Partial<Vote> = {}): Vote {
  return {
    id: new ObjectId(VALID_VID),
    question: 'Test?',
    type: VoteType.YESNO,
    options: ['Pour', 'Contre'],
    isAnonymous: false,
    endsAt: new Date(Date.now() + 86400000), // tomorrow
    neighbourhoodId: VALID_NID,
    results: [
      { option: 'Pour', userIds: [] },
      { option: 'Contre', userIds: [] },
    ],
    createdAt: new Date(),
    ...overrides,
  } as Vote;
}

describe('VotesService', () => {
  let service: VotesService;

  const mockVotesRepo = {
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockNeighbourhoodsRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotesService,
        { provide: getRepositoryToken(Vote, 'mongodb'), useValue: mockVotesRepo },
        { provide: getRepositoryToken(Neighbourhood, 'mongodb'), useValue: mockNeighbourhoodsRepo },
      ],
    }).compile();

    service = module.get<VotesService>(VotesService);
    jest.clearAllMocks();
  });

  describe('cast', () => {
    it('throws ForbiddenException on expired vote', async () => {
      const expired = makeVote({ endsAt: new Date(Date.now() - 1000) });
      mockVotesRepo.findOneBy.mockResolvedValue(expired);

      await expect(service.cast(VALID_VID, { option: 'Pour', userId: USER_ID }))
        .rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException on invalid option', async () => {
      mockVotesRepo.findOneBy.mockResolvedValue(makeVote());

      await expect(service.cast(VALID_VID, { option: 'Abstention', userId: USER_ID }))
        .rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user already voted', async () => {
      const uid = new ObjectId(USER_ID);
      const vote = makeVote({
        results: [
          { option: 'Pour', userIds: [uid] },
          { option: 'Contre', userIds: [] },
        ],
      });
      mockVotesRepo.findOneBy.mockResolvedValue(vote);

      await expect(service.cast(VALID_VID, { option: 'Contre', userId: USER_ID }))
        .rejects.toThrow(ForbiddenException);
    });

    it('adds userId to chosen option and returns saved vote', async () => {
      const vote = makeVote();
      mockVotesRepo.findOneBy.mockResolvedValue(vote);
      mockVotesRepo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.cast(VALID_VID, { option: 'Pour', userId: USER_ID });

      const pourEntry = result.results.find((r) => r.option === 'Pour')!;
      expect(pourEntry.userIds).toHaveLength(1);
      expect(pourEntry.userIds[0].toString()).toBe(USER_ID);
    });

    it('strips userIds from response when vote is anonymous', async () => {
      const vote = makeVote({ isAnonymous: true });
      mockVotesRepo.findOneBy.mockResolvedValue(vote);
      mockVotesRepo.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.cast(VALID_VID, { option: 'Pour', userId: USER_ID });

      result.results.forEach((r) => expect(r.userIds).toHaveLength(0));
    });
  });
});
