import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

type SocketUser = {
  sub: string;
  email: string;
};

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
    credentials: true
  }
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit('error.message', { message: 'Unauthorized socket connection' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<SocketUser>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret')
      });
      client.data.user = payload;
      client.join(this.userRoom(payload.sub));
      client.emit('socket.ready', { userId: payload.sub });
    } catch {
      client.emit('error.message', { message: 'Unauthorized socket connection' });
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage('conversation.join')
  joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string }
  ) {
    const conversationId = body?.conversationId;
    if (!conversationId) return { ok: false };
    client.join(this.conversationRoom(conversationId));
    return { ok: true, conversationId };
  }

  @SubscribeMessage('conversation.leave')
  leaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string }
  ) {
    const conversationId = body?.conversationId;
    if (!conversationId) return { ok: false };
    client.leave(this.conversationRoom(conversationId));
    return { ok: true, conversationId };
  }

  @SubscribeMessage('typing.start')
  typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string; displayName?: string }
  ) {
    const conversationId = body?.conversationId;
    const userId = client.data.user?.sub;
    if (!conversationId || !userId) return { ok: false };
    client.to(this.conversationRoom(conversationId)).emit('typing.start', {
      conversationId,
      userId,
      displayName: body?.displayName || 'Đối phương'
    });
    return { ok: true };
  }

  @SubscribeMessage('typing.stop')
  typingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string }
  ) {
    const conversationId = body?.conversationId;
    const userId = client.data.user?.sub;
    if (!conversationId || !userId) return { ok: false };
    client.to(this.conversationRoom(conversationId)).emit('typing.stop', {
      conversationId,
      userId
    });
    return { ok: true };
  }

  emitMessageCreated(conversationId: string, payload: unknown) {
    this.server.to(this.conversationRoom(conversationId)).emit('message.new', payload);
  }

  emitMessageDelivered(conversationId: string, payload: unknown) {
    this.server.to(this.conversationRoom(conversationId)).emit('message.delivered', payload);
  }

  emitMessageSeen(conversationId: string, payload: unknown) {
    this.server.to(this.conversationRoom(conversationId)).emit('message.seen', payload);
  }

  emitMessageUpdated(conversationId: string, payload: unknown) {
    this.server.to(this.conversationRoom(conversationId)).emit('message.updated', payload);
  }

  emitMessageReactionUpdated(conversationId: string, payload: unknown) {
    this.server.to(this.conversationRoom(conversationId)).emit('message.reaction_updated', payload);
  }

  emitConversationRead(conversationId: string, payload: unknown) {
    this.server.to(this.conversationRoom(conversationId)).emit('conversation.read', payload);
  }

  emitNotificationCreated(userId: string, payload: unknown) {
    this.server.to(this.userRoom(userId)).emit('notification.new', payload);
  }

  emitNotificationsReadAll(userId: string, payload: unknown) {
    this.server.to(this.userRoom(userId)).emit('notification.read_all', payload);
  }

  emitMatchCreated(userIds: string[], payload: unknown) {
    userIds.forEach((userId) => {
      this.server.to(this.userRoom(userId)).emit('match.created', payload);
    });
  }

  emitUserBlocked(userIds: string[], payload: unknown) {
    userIds.forEach((userId) => {
      this.server.to(this.userRoom(userId)).emit('user.blocked', payload);
    });
  }

  private extractToken(client: Socket) {
    const authToken = typeof client.handshake.auth?.token === 'string'
      ? client.handshake.auth.token
      : undefined;
    const bearerHeader = typeof client.handshake.headers.authorization === 'string'
      ? client.handshake.headers.authorization
      : undefined;
    if (authToken) return authToken;
    if (bearerHeader?.startsWith('Bearer ')) return bearerHeader.slice(7);
    return undefined;
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }
}
