import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-messages.dto';
import { Conversation } from '../../entities/mongodb/Conversation';
import { Message } from '../../entities/mongodb/Message';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Créer ou récupérer une conversation' })
  @ApiResponse({ status: 201, type: Conversation })
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

  @ApiOperation({ summary: 'Envoyer un message' })
  @ApiResponse({ status: 201, type: Message })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée.' })
  @Post('messages')
  sendMessage(@Body() dto: CreateMessageDto) {
    return this.messagesService.sendMessage(dto);
  }

  @ApiOperation({ summary: 'Messages d\'une conversation' })
  @ApiParam({ name: 'conversationId', description: 'ObjectId MongoDB de la conversation' })
  @ApiResponse({ status: 200, type: [Message] })
  @Get('messages/:conversationId')
  findMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.findMessagesByConversation(conversationId);
  }
}
