import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { getDataSourceToken } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { Conversation } from '../../entities/mongodb/Conversation';
import { Message } from '../../entities/mongodb/Message';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../entities/mongodb/User';

const CONV_ID = new ObjectId().toHexString();
const UID_A = new ObjectId().toHexString();
const UID_B = new ObjectId().toHexString();
const UID_C = new ObjectId().toHexString();
const NID_1 = new ObjectId().toHexString();
const NID_2 = new ObjectId().toHexString();

function makeUser(id: string, role: UserRole, neighbourhoodId: string | null) {
  return { _id: new ObjectId(id), role, neighbourhoodId };
}

describe('MessagesService', () => {
  let service: MessagesService;

  const mockConversationsRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    updateOne: jest.fn(),
    find: jest.fn(),
  };

  const mockMessagesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getRepositoryToken(Conversation, 'mongodb'), useValue: mockConversationsRepo },
        { provide: getRepositoryToken(Message, 'mongodb'), useValue: mockMessagesRepo },
        { provide: getDataSourceToken('mongodb'), useValue: mockDataSource },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('throws ForbiddenException when participants are in different neighbourhoods', async () => {
      mockUsersService.findOne
        .mockResolvedValueOnce(makeUser(UID_A, UserRole.HABITANT, NID_1))
        .mockResolvedValueOnce(makeUser(UID_B, UserRole.HABITANT, NID_2));

      await expect(service.createConversation({ participants: [UID_A, UID_B] }))
        .rejects.toThrow(ForbiddenException);
    });

    it('allows conversation when admin is one of the participants', async () => {
      mockUsersService.findOne
        .mockResolvedValueOnce(makeUser(UID_A, UserRole.ADMIN, null))
        .mockResolvedValueOnce(makeUser(UID_B, UserRole.HABITANT, NID_2));

      mockConversationsRepo.findOne.mockResolvedValue(null);
      const fakeConv = { id: new ObjectId(), participants: [UID_A, UID_B] };
      mockConversationsRepo.create.mockReturnValue(fakeConv);
      mockConversationsRepo.save.mockResolvedValue(fakeConv);

      const result = await service.createConversation({ participants: [UID_A, UID_B] });

      expect(result).toEqual(fakeConv);
    });

    it('returns existing conversation instead of creating duplicate', async () => {
      mockUsersService.findOne
        .mockResolvedValueOnce(makeUser(UID_A, UserRole.HABITANT, NID_1))
        .mockResolvedValueOnce(makeUser(UID_B, UserRole.HABITANT, NID_1));

      const existing = { id: new ObjectId(), participants: [UID_A, UID_B] };
      mockConversationsRepo.findOne.mockResolvedValue(existing);

      const result = await service.createConversation({ participants: [UID_A, UID_B] });

      expect(result).toBe(existing);
      expect(mockConversationsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('throws ForbiddenException when sender is not a participant', async () => {
      mockConversationsRepo.findOneBy.mockResolvedValue({
        id: new ObjectId(CONV_ID),
        participants: [UID_A, UID_B],
      });

      await expect(
        service.sendMessage({ conversationId: CONV_ID, senderId: UID_C, content: 'Hello' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('saves and returns message when sender is participant', async () => {
      mockConversationsRepo.findOneBy.mockResolvedValue({
        id: new ObjectId(CONV_ID),
        participants: [UID_A, UID_B],
      });
      const fakeMsg = { conversationId: CONV_ID, senderId: UID_A, content: 'Hello' };
      mockMessagesRepo.create.mockReturnValue(fakeMsg);
      mockMessagesRepo.save.mockResolvedValue(fakeMsg);
      mockConversationsRepo.updateOne.mockResolvedValue(undefined);

      const result = await service.sendMessage({ conversationId: CONV_ID, senderId: UID_A, content: 'Hello' });

      expect(result).toEqual(fakeMsg);
      expect(mockMessagesRepo.save).toHaveBeenCalled();
    });
  });
});
