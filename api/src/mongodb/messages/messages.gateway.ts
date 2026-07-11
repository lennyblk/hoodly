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

  // userId → Set of socketIds (un user peut avoir plusieurs onglets)
  private onlineUsers = new Map<string, Set<string>>();
  // socketId → userId (reverse lookup pour disconnect)
  private socketToUser = new Map<string, string>();

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    console.log(`[WS] Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.socketToUser.delete(client.id);
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.server.emit('userOffline', { userId });
        }
      }
    }
    console.log(`[WS] Client déconnecté : ${client.id}`);
  }

  // Client s'enregistre avec son userId pour tracker la présence
  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.socketToUser.set(client.id, userId);
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
      // Premier socket pour ce user → il passe online
      this.server.emit('userOnline', { userId });
    }
    this.onlineUsers.get(userId)!.add(client.id);

    // Envoyer la liste des users online a l'arrivant
    const onlineIds = Array.from(this.onlineUsers.keys());
    client.emit('onlineUsers', onlineIds);
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

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}
