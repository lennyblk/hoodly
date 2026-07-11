import { Controller, Get, Post, Body, Param, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-messages.dto';
import { Conversation } from '../../entities/mongodb/Conversation';
import { Message } from '../../entities/mongodb/Message';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @ApiOperation({ summary: 'Créer ou récupérer une conversation entre voisins du même quartier' })
  @ApiResponse({ status: 201, type: Conversation })
  @ApiResponse({ status: 403, description: 'Participants pas du même quartier.' })
  @Post('conversations')
  createConversation(@Body() dto: CreateConversationDto) {
    return this.messagesService.createConversation(dto);
  }

  @ApiOperation({ summary: 'Conversations d\'un utilisateur' })
  @ApiParam({ name: 'userId', description: 'ObjectId MongoDB de l\'utilisateur' })
  @ApiResponse({ status: 200, type: [Conversation] })
  @Get('conversations/user/:userId')
  findConversationsByUser(@Param('userId') userId: string) {
    return this.messagesService.findConversationsByUser(userId);
  }

  @ApiOperation({ summary: 'Envoyer un message (REST — préférer WebSocket en prod)' })
  @ApiResponse({ status: 201, type: Message })
  @ApiResponse({ status: 403, description: 'Sender pas participant de la conversation.' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée.' })
  @Post('messages')
  sendMessage(@Body() dto: CreateMessageDto) {
    return this.messagesService.sendMessage(dto);
  }

  @ApiOperation({ summary: 'Historique des messages d\'une conversation' })
  @ApiParam({ name: 'conversationId', description: 'ObjectId MongoDB de la conversation' })
  @ApiResponse({ status: 200, type: [Message] })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée.' })
  @Get('messages/:conversationId')
  findMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.findMessagesByConversation(conversationId);
  }

  @ApiOperation({ summary: 'Liste des userIds actuellement en ligne (WebSocket)' })
  @ApiResponse({ status: 200, description: 'Array de userIds online.' })
  @Get('users/online')
  getOnlineUsers() {
    return this.messagesGateway.getOnlineUserIds();
  }

  @ApiOperation({ summary: 'Upload un fichier media (image/audio) pour le chat' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Fichier uploadé, fileId retourné.' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('messages/upload')
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file provided');
    const fileId = await this.messagesService.uploadMedia(file);
    return { fileId };
  }

  @ApiOperation({ summary: 'Récupérer un fichier media du chat' })
  @ApiParam({ name: 'fileId', description: 'ID GridFS du fichier' })
  @ApiResponse({ status: 200, description: 'Fichier binaire.' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé.' })
  @Get('messages/media/:fileId')
  async getMedia(@Param('fileId') fileId: string, @Res() res: Response) {
    const { buffer, contentType, filename } = await this.messagesService.downloadMedia(fileId);
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
