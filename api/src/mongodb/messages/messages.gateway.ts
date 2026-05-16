import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-messages.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log(`[WS] Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WS] Client déconnecté : ${client.id}`);
  }

  // Client rejoint la room d'une conversation
  @SubscribeMessage('joinConversation')
  handleJoin(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
    client.emit('joinedConversation', { conversationId });
  }

  // Client quitte la room
  @SubscribeMessage('leaveConversation')
  handleLeave(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(conversationId);
  }

  // Client envoie un message → sauvegarde DB + broadcast à la room
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.messagesService.sendMessage(dto);
      // Broadcast à tous les membres de la conversation (including sender)
      this.server.to(dto.conversationId).emit('newMessage', message);
    } catch (err) {
      client.emit('error', { message: 'Échec envoi du message' });
    }
  }
}
