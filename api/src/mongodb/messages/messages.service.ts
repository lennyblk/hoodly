import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { Conversation } from '../../entities/mongodb/Conversation';
import { Message } from '../../entities/mongodb/Message';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../entities/mongodb/User';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-messages.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation, 'mongodb')
    private conversationsRepository: MongoRepository<Conversation>,
    @InjectRepository(Message, 'mongodb')
    private messagesRepository: MongoRepository<Message>,
    private usersService: UsersService,
  ) {}

  async createConversation(dto: CreateConversationDto) {
    // Fetch tous les participants
    const users = await Promise.all(
      dto.participants.map((id) => this.usersService.findOne(id)),
    );

    // Admin peut contacter tout le monde — check seulement si aucun admin dans la conv
    const hasAdmin = users.some((u) => u.role === UserRole.ADMIN);
    if (!hasAdmin) {
      const neighbourhoodIds = users.map((u) => u.neighbourhoodId);
      const allSameNeighbourhood =
        neighbourhoodIds.every((n) => n) &&
        new Set(neighbourhoodIds).size === 1;

      if (!allSameNeighbourhood) {
        throw new ForbiddenException(
          'Les participants doivent être du même quartier',
        );
      }
    }

    // Retourner conversation existante si déjà créée entre ces mêmes participants
    const existing = await this.conversationsRepository.findOne({
      where: { participants: { $all: dto.participants } } as any,
    });
    if (existing) return existing;

    const conversation = this.conversationsRepository.create({
      participants: dto.participants,
    });
    return this.conversationsRepository.save(conversation);
  }

  async findConversationsByUser(userId: string) {
    return this.conversationsRepository.find({
      where: { participants: { $in: [userId] } } as any,
    });
  }

  async findConversationById(id: string) {
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new BadRequestException('Invalid ID format');
    }
    const conversation = await this.conversationsRepository.findOneBy({ _id: objectId } as any);
    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }
    return conversation;
  }

  async sendMessage(dto: CreateMessageDto) {
    const conversation = await this.findConversationById(dto.conversationId);

    // Vérifier que le sender est participant de la conversation
    if (!conversation.participants.includes(dto.senderId)) {
      throw new ForbiddenException(
        'Vous ne participez pas à cette conversation',
      );
    }

    const message = this.messagesRepository.create(dto);
    const saved = await this.messagesRepository.save(message);

    await this.conversationsRepository.updateOne(
      { _id: new ObjectId(dto.conversationId) },
      { $set: { lastMessage: dto.content } },
    );

    return saved;
  }

  async findMessagesByConversation(conversationId: string) {
    await this.findConversationById(conversationId);
    return this.messagesRepository.find({
      where: { conversationId } as any,
      order: { createdAt: 'ASC' } as any,
    });
  }
}
