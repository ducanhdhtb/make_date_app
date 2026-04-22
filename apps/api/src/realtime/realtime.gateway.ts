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
        console.warn('[Realtime] No token provided, disconnecting');
        client.emit('error.message', { message: 'Unauthorized socket connection' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<SocketUser>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret')
      });
      client.data.user = payload;
      client.join(this.userRoom(payload.sub));
      console.log(`[Realtime] User ${payload.email} connected (${client.id})`);
      client.emit('socket.ready', { userId: payload.sub });
    } catch (error) {
      console.error('[Realtime] Connection error:', error instanceof Error ? error.message : error);
      client.emit('error.message', { message: 'Unauthorized socket connection' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as SocketUser | undefined;
    if (user) {
      console.log(`[Realtime] User ${user.email} disconnected (${client.id})`);
    }
  }

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

  // Group Chat Events
  @SubscribeMessage('group.join')
  joinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { groupConversationId?: string }
  ) {
    const groupConversationId = body?.groupConversationId;
    if (!groupConversationId) return { ok: false };
    client.join(this.groupRoom(groupConversationId));
    return { ok: true, groupConversationId };
  }

  @SubscribeMessage('group.leave')
  leaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { groupConversationId?: string }
  ) {
    const groupConversationId = body?.groupConversationId;
    if (!groupConversationId) return { ok: false };
    client.leave(this.groupRoom(groupConversationId));
    return { ok: true, groupConversationId };
  }

  @SubscribeMessage('group.typing.start')
  groupTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { groupConversationId?: string; displayName?: string }
  ) {
    const groupConversationId = body?.groupConversationId;
    const userId = client.data.user?.sub;
    if (!groupConversationId || !userId) return { ok: false };
    client.to(this.groupRoom(groupConversationId)).emit('group.typing.start', {
      groupConversationId,
      userId,
      displayName: body?.displayName || 'Đối phương'
    });
    return { ok: true };
  }

  @SubscribeMessage('group.typing.stop')
  groupTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { groupConversationId?: string }
  ) {
    const groupConversationId = body?.groupConversationId;
    const userId = client.data.user?.sub;
    if (!groupConversationId || !userId) return { ok: false };
    client.to(this.groupRoom(groupConversationId)).emit('group.typing.stop', {
      groupConversationId,
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

  // Group Chat Emit Methods
  emitGroupMessageCreated(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.message.new', payload);
  }

  emitGroupMessageDelivered(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.message.delivered', payload);
  }

  emitGroupMessageSeen(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.message.seen', payload);
  }

  emitGroupMessageUpdated(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.message.updated', payload);
  }

  emitGroupMessageReactionUpdated(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.message.reaction_updated', payload);
  }

  emitGroupMemberAdded(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.member.added', payload);
  }

  emitGroupMemberRemoved(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.member.removed', payload);
  }

  emitGroupUpdated(groupConversationId: string, payload: unknown) {
    this.server.to(this.groupRoom(groupConversationId)).emit('group.updated', payload);
  }

  // ============ VIDEO/VOICE CALL EVENTS ============

  // Emit incoming call to receiver
  emitIncomingCall(receiverId: string, payload: unknown) {
    this.server.to(this.userRoom(receiverId)).emit('call.incoming', payload);
  }

  // Emit call answered to caller
  emitCallAnswered(callerId: string, payload: unknown) {
    this.server.to(this.userRoom(callerId)).emit('call.answered', payload);
  }

  // Emit call rejected to caller
  emitCallRejected(callerId: string, payload: unknown) {
    this.server.to(this.userRoom(callerId)).emit('call.rejected', payload);
  }

  // Emit call ended to both parties
  emitCallEnded(userIds: string[], payload: unknown) {
    userIds.forEach((userId) => {
      this.server.to(this.userRoom(userId)).emit('call.ended', payload);
    });
  }

  // WebRTC Signaling - SDP Offer
  @SubscribeMessage('call.sdp_offer')
  handleSdpOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string; sdp?: unknown; receiverId?: string }
  ) {
    const { callId, sdp, receiverId } = body;
    if (!callId || !sdp || !receiverId) return { ok: false };
    
    // Forward SDP offer to receiver
    this.server.to(this.userRoom(receiverId)).emit('call.sdp_offer', {
      callId,
      sdp,
      callerId: client.data.user?.sub
    });
    return { ok: true };
  }

  // WebRTC Signaling - SDP Answer
  @SubscribeMessage('call.sdp_answer')
  handleSdpAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string; sdp?: unknown; callerId?: string }
  ) {
    const { callId, sdp, callerId } = body;
    if (!callId || !sdp || !callerId) return { ok: false };
    
    // Forward SDP answer to caller
    this.server.to(this.userRoom(callerId)).emit('call.sdp_answer', {
      callId,
      sdp,
      receiverId: client.data.user?.sub
    });
    return { ok: true };
  }

  // WebRTC Signaling - ICE Candidate
  @SubscribeMessage('call.ice_candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string; candidate?: unknown; targetUserId?: string }
  ) {
    const { callId, candidate, targetUserId } = body;
    if (!callId || !candidate || !targetUserId) return { ok: false };
    
    // Forward ICE candidate to target user
    this.server.to(this.userRoom(targetUserId)).emit('call.ice_candidate', {
      callId,
      candidate,
      fromUserId: client.data.user?.sub
    });
    return { ok: true };
  }

  // Call answer event
  @SubscribeMessage('call.answer')
  handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string; callerId?: string }
  ) {
    const { callId, callerId } = body;
    if (!callId || !callerId) return { ok: false };
    
    // Notify caller that receiver answered
    this.server.to(this.userRoom(callerId)).emit('call.answered', {
      callId,
      receiverId: client.data.user?.sub
    });
    return { ok: true };
  }

  // Call reject event
  @SubscribeMessage('call.reject')
  handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string; callerId?: string; reason?: string }
  ) {
    const { callId, callerId, reason } = body;
    if (!callId || !callerId) return { ok: false };
    
    // Notify caller that receiver rejected
    this.server.to(this.userRoom(callerId)).emit('call.rejected', {
      callId,
      receiverId: client.data.user?.sub,
      reason: reason || 'rejected'
    });
    return { ok: true };
  }

  // Call end event
  @SubscribeMessage('call.end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { callId?: string; targetUserId?: string; duration?: number }
  ) {
    const { callId, targetUserId, duration } = body;
    if (!callId || !targetUserId) return { ok: false };
    
    // Notify other party that call ended
    this.server.to(this.userRoom(targetUserId)).emit('call.ended', {
      callId,
      endedBy: client.data.user?.sub,
      duration: duration || 0
    });
    return { ok: true };
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

  private groupRoom(groupConversationId: string) {
    return `group:${groupConversationId}`;
  }
}
