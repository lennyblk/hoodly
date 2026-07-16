import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MongoRepository } from 'typeorm';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { Conversation } from '../../entities/mongodb/Conversation';
import { Message, MessageType } from '../../entities/mongodb/Message';
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
    @InjectDataSource('mongodb')
    private dataSource: DataSource,
    private usersService: UsersService,
  ) {}

  // ─── GridFS helpers ───────────────────────────────────────────────────

  private getBucket(): GridFSBucket {
    const mongoClient = (this.dataSource.driver as any).queryRunner.databaseConnection;
    const db = mongoClient.db();
    return new GridFSBucket(db, { bucketName: 'chat_media' });
  }

  async uploadMedia(file: Express.Multer.File): Promise<string> {
    const bucket = this.getBucket();
    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
      });
      Readable.from(file.buffer)
        .pipe(uploadStream)
        .on('finish', () => resolve(uploadStream.id.toString()))
        .on('error', reject);
    });
  }

  async downloadMedia(fileId: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const bucket = this.getBucket();
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(fileId);
    } catch {
      throw new BadRequestException('Invalid file ID format');
    }

    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      throw new NotFoundException('File not found');
    }
    const fileInfo = files[0];

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      bucket.openDownloadStream(objectId)
        .on('data', (chunk: Buffer) => chunks.push(chunk))
        .on('end', () => resolve({
          buffer: Buffer.concat(chunks),
          contentType: fileInfo.contentType || 'application/octet-stream',
          filename: fileInfo.filename || 'file',
        }))
        .on('error', reject);
    });
  }

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

  private async assertConversationWritable(conversation: Conversation) {
    const users = await Promise.all(
      conversation.participants.map((id) =>
        this.usersService.findOne(id).catch(() => null),
      ),
    );
    const present = users.filter((u): u is NonNullable<(typeof users)[number]> => u !== null);

    const hasAdmin = present.some((u) => u.role === UserRole.ADMIN);
    if (hasAdmin) return;

    const neighbourhoodIds = present.map((u) => u.neighbourhoodId?.toString());
    const allSameNeighbourhood =
      present.length === conversation.participants.length &&
      neighbourhoodIds.every((n) => n) &&
      new Set(neighbourhoodIds).size === 1;

    if (!allSameNeighbourhood) {
      throw new ForbiddenException(
        'Conversation en lecture seule : vous ne faites plus partie du même quartier',
      );
    }
  }

  async sendMessage(dto: CreateMessageDto) {
    const conversation = await this.findConversationById(dto.conversationId);

    // Vérifier que le sender est participant de la conversation
    if (!conversation.participants.includes(dto.senderId)) {
      throw new ForbiddenException(
        'Vous ne participez pas à cette conversation',
      );
    }

    await this.assertConversationWritable(conversation);

    const message = this.messagesRepository.create(dto);
    const saved = await this.messagesRepository.save(message);

    const lastMessage = dto.type === MessageType.IMAGE
      ? 'Photo'
      : dto.type === MessageType.AUDIO
        ? 'Audio'
        : dto.type === MessageType.FILE
          ? (dto.fileName ?? 'Document')
          : dto.content ?? '';

    await this.conversationsRepository.updateOne(
      { _id: new ObjectId(dto.conversationId) },
      { $set: { lastMessage } },
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
