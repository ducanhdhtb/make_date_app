import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, CreateMessageDto, ForwardMessageDto, ListMessagesQueryDto } from './dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  private async assertCanInteract(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) throw new BadRequestException('Invalid target user');

    const pair = [currentUserId, targetUserId].sort();
    const match = await this.prisma.match.findUnique({
      where: { user1Id_user2Id: { user1Id: pair[0], user2Id: pair[1] } }
    });
    if (!match || match.status !== 'active') {
      throw new ForbiddenException('Conversation requires active match');
    }

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerUserId: currentUserId, blockedUserId: targetUserId },
          { blockerUserId: targetUserId, blockedUserId: currentUserId }
        ]
      }
    });
    if (block) throw new ForbiddenException('Conversation unavailable due to block');
  }

  async create(currentUserId: string, dto: CreateConversationDto) {
    await this.assertCanInteract(currentUserId, dto.targetUserId);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: dto.targetUserId } } }
        ]
      },
      include: {
        participants: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
        }
      }
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        type: 'direct',
        participants: {
          create: [{ userId: currentUserId }, { userId: dto.targetUserId }]
        }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
        }
      }
    });
  }

  async listMine(currentUserId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId: currentUserId } } },
      include: {
        participants: {
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, displayName: true } },
            receipts: { where: { userId: currentUserId }, select: { deliveredAt: true, seenAt: true } },
            parentMessage: { include: { sender: { select: { id: true, displayName: true } } } },
            reactions: { include: { user: { select: { id: true, displayName: true } } } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const participantReads = await this.prisma.conversationParticipant.findMany({
      where: { userId: currentUserId, conversationId: { in: conversations.map((c) => c.id) } },
      select: { conversationId: true, lastReadAt: true }
    });

    const unreadMap = new Map<string, number>();
    await Promise.all(
      participantReads.map(async (participant) => {
        const count = await this.prisma.message.count({
          where: {
            conversationId: participant.conversationId,
            senderUserId: { not: currentUserId },
            createdAt: participant.lastReadAt ? { gt: participant.lastReadAt } : undefined,
            deletedAt: null,
            recalledAt: null
          }
        });
        unreadMap.set(participant.conversationId, count);
      })
    );

    return conversations.map((conversation) => ({
      ...conversation,
      unreadCount: unreadMap.get(conversation.id) ?? 0,
      messages: conversation.messages.map((message) => this.mapMessageForUser(message, currentUserId))
    }));
  }

  async listPins(currentUserId: string, conversationId: string) {
    await this.assertParticipant(currentUserId, conversationId);
    const rows = await this.prisma.message.findMany({
      where: { conversationId, pinnedAt: { not: null } },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      },
      orderBy: [{ pinnedAt: 'desc' }]
    });
    return rows.map((message) => this.mapMessageForUser(message, currentUserId));
  }

  async listMessages(currentUserId: string, conversationId: string, query: ListMessagesQueryDto) {
    await this.assertParticipant(currentUserId, conversationId);
    const readAt = new Date();
    const take = query.limit ?? 20;
    const beforeDate = query.before ? new Date(query.before) : null;

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
      data: { lastReadAt: readAt }
    });

    await this.prisma.messageReceipt.updateMany({
      where: {
        userId: currentUserId,
        message: { conversationId, senderUserId: { not: currentUserId } },
        OR: [{ deliveredAt: null }, { seenAt: null }]
      },
      data: { deliveredAt: readAt, seenAt: readAt }
    });

    const seenMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderUserId: { not: currentUserId },
        receipts: { some: { userId: currentUserId, seenAt: readAt } }
      },
      select: { id: true }
    });

    if (!beforeDate) {
      this.realtimeGateway.emitConversationRead(conversationId, {
        conversationId,
        userId: currentUserId,
        readAt: readAt.toISOString()
      });

      if (seenMessages.length) {
        this.realtimeGateway.emitMessageSeen(conversationId, {
          conversationId,
          userId: currentUserId,
          messageIds: seenMessages.map((item) => item.id),
          seenAt: readAt.toISOString()
        });
      }
    }

    const rows = await this.prisma.message.findMany({
      where: {
        conversationId,
        createdAt: beforeDate ? { lt: beforeDate } : undefined,
        OR: query.q ? [
          { textContent: { contains: query.q, mode: 'insensitive' } },
          { parentMessage: { is: { textContent: { contains: query.q, mode: 'insensitive' } } } }
        ] : undefined
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1
    });

    const hasMore = rows.length > take;
    const sliced = hasMore ? rows.slice(0, take) : rows;
    const items = sliced.reverse().map((message) => this.mapMessageForUser(message, currentUserId));

    return {
      items,
      hasMore,
      nextCursor: hasMore && items.length ? items[0].createdAt.toISOString() : null
    };
  }

  async createMessage(currentUserId: string, conversationId: string, dto: CreateMessageDto) {
    if (!dto.textContent && !dto.mediaUrl) {
      throw new BadRequestException('textContent or mediaUrl is required');
    }

    const conversation = await this.assertParticipant(currentUserId, conversationId);
    const otherParticipants = conversation.participants.filter((p) => p.userId !== currentUserId);
    const createdAt = new Date();

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderUserId: currentUserId,
        parentMessageId: dto.parentMessageId,
        forwardedFromMessageId: dto.forwardedFromMessageId,
        messageType: dto.messageType || (dto.mediaUrl ? 'image' : 'text'),
        textContent: dto.textContent,
        mediaUrl: dto.mediaUrl,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        durationSeconds: dto.durationSeconds,
        receipts: {
          create: otherParticipants.map((participant) => ({
            userId: participant.userId
          }))
        }
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      }
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: createdAt }
    });

    const deliveredAt = new Date();
    await this.prisma.messageReceipt.updateMany({
      where: { messageId: message.id },
      data: { deliveredAt }
    });
    await this.prisma.message.update({
      where: { id: message.id },
      data: { deliveredAt }
    });

    const notifications = await Promise.all(
      otherParticipants.map((participant) =>
        this.prisma.notification.create({
          data: {
            userId: participant.userId,
            type: 'new_message',
            title: 'Tin nhắn mới',
            body: dto.textContent ?? (dto.messageType === 'audio' ? 'Bạn nhận được một audio mới' : dto.messageType === 'file' ? 'Bạn nhận được một tệp mới' : 'Bạn nhận được một hình ảnh mới'),
            data: { conversationId, senderUserId: currentUserId } as never
          }
        })
      )
    );

    const realtimeMessage = this.mapMessageForUser({
      ...message,
      deliveredAt: deliveredAt.toISOString(),
      seenAt: null,
      recalledAt: null,
      deletedAt: null
    }, currentUserId);

    this.realtimeGateway.emitMessageCreated(conversationId, {
      conversationId,
      message: realtimeMessage
    });

    this.realtimeGateway.emitMessageDelivered(conversationId, {
      conversationId,
      messageIds: [message.id],
      deliveredAt: deliveredAt.toISOString()
    });

    notifications.forEach((notification) => {
      this.realtimeGateway.emitNotificationCreated(notification.userId, notification);
    });

    return realtimeMessage;
  }

  async recallMessage(currentUserId: string, conversationId: string, messageId: string) {
    await this.assertParticipant(currentUserId, conversationId);
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      }
    });
    if (!message) throw new BadRequestException('Message not found');
    if (message.senderUserId !== currentUserId) throw new ForbiddenException('Only sender can recall message');

    const recalledAt = new Date();
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        messageType: 'text',
        textContent: 'Tin nhắn đã được thu hồi',
        mediaUrl: null,
        recalledAt
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      }
    });
    const payload = this.mapMessageForUser({
      ...updated,
      recalledAt: recalledAt.toISOString(),
      deletedAt: updated.deletedAt || null
    }, currentUserId);
    this.realtimeGateway.emitMessageUpdated(conversationId, { conversationId, message: payload });
    return payload;
  }

  async deleteMessage(currentUserId: string, conversationId: string, messageId: string) {
    await this.assertParticipant(currentUserId, conversationId);
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, conversationId },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      }
    });
    if (!message) throw new BadRequestException('Message not found');
    if (message.senderUserId !== currentUserId) throw new ForbiddenException('Only sender can delete message');

    const deletedAt = new Date();
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        messageType: 'text',
        textContent: 'Tin nhắn đã bị xóa',
        mediaUrl: null,
        deletedAt
      },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      }
    });
    const payload = this.mapMessageForUser({
      ...updated,
      recalledAt: updated.recalledAt || null,
      deletedAt: deletedAt.toISOString()
    }, currentUserId);
    this.realtimeGateway.emitMessageUpdated(conversationId, { conversationId, message: payload });
    return payload;
  }


  async pinMessage(currentUserId: string, conversationId: string, messageId: string) {
    await this.assertParticipant(currentUserId, conversationId);
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { pinnedAt: new Date() },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      }
    });
    const payload = this.mapMessageForUser(updated, currentUserId);
    this.realtimeGateway.emitMessageUpdated(conversationId, { conversationId, message: payload });
    return payload;
  }

  async unpinMessage(currentUserId: string, conversationId: string, messageId: string) {
    await this.assertParticipant(currentUserId, conversationId);
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { pinnedAt: null },
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } },
        receipts: { select: { userId: true, deliveredAt: true, seenAt: true } },
        parentMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        forwardedFromMessage: { include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } } },
        reactions: { include: { user: { select: { id: true, displayName: true } } } }
      }
    });
    const payload = this.mapMessageForUser(updated, currentUserId);
    this.realtimeGateway.emitMessageUpdated(conversationId, { conversationId, message: payload });
    return payload;
  }

  async forwardMessage(currentUserId: string, conversationId: string, messageId: string, dto: ForwardMessageDto) {
    await this.assertParticipant(currentUserId, conversationId);
    await this.assertParticipant(currentUserId, dto.targetConversationId);
    const source = await this.prisma.message.findFirst({ where: { id: messageId, conversationId } });
    if (!source) throw new BadRequestException('Message not found');
    const prefix = dto.note?.trim() ? `${dto.note.trim()}

` : '';
    return this.createMessage(currentUserId, dto.targetConversationId, {
      textContent: `${prefix}${source.textContent || ''}`.trim() || undefined,
      mediaUrl: source.mediaUrl || undefined,
      messageType: source.messageType as any,
      fileName: source.fileName || undefined,
      mimeType: source.mimeType || undefined,
      fileSize: source.fileSize || undefined,
      durationSeconds: source.durationSeconds || undefined,
      forwardedFromMessageId: source.id
    });
  }



  async addReaction(currentUserId: string, conversationId: string, messageId: string, emoji: string) {
    await this.assertParticipant(currentUserId, conversationId);
    const message = await this.prisma.message.findFirst({ where: { id: messageId, conversationId } });
    if (!message) throw new BadRequestException('Message not found');

    await this.prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId: currentUserId, emoji } },
      update: {},
      create: { messageId, userId: currentUserId, emoji }
    });

    const payload = await this.buildReactionPayload(messageId, currentUserId);
    this.realtimeGateway.emitMessageReactionUpdated(conversationId, { conversationId, messageId, reactions: payload });
    return payload;
  }

  async removeReaction(currentUserId: string, conversationId: string, messageId: string, emoji: string) {
    await this.assertParticipant(currentUserId, conversationId);
    await this.prisma.messageReaction.deleteMany({ where: { messageId, userId: currentUserId, emoji } });
    const payload = await this.buildReactionPayload(messageId, currentUserId);
    this.realtimeGateway.emitMessageReactionUpdated(conversationId, { conversationId, messageId, reactions: payload });
    return payload;
  }

  private async buildReactionPayload(messageId: string, currentUserId?: string) {
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'asc' }
    });

    const grouped = new Map<
      string,
      { emoji: string; count: number; reacted?: boolean; users: { id: string; displayName: string }[] }
    >();
    reactions.forEach((reaction) => {
      const existing =
        grouped.get(reaction.emoji) ??
        ({
          emoji: reaction.emoji,
          count: 0,
          reacted: false,
          users: [] as { id: string; displayName: string }[]
        });
      existing.count += 1;
      existing.users.push(reaction.user);
      if (currentUserId && reaction.userId === currentUserId) existing.reacted = true;
      grouped.set(reaction.emoji, existing);
    });
    return Array.from(grouped.values());
  }

  private mapMessageForUser(message: any, currentUserId: string) {
    const recipientReceipt = message.receipts?.find((receipt: any) => receipt.userId !== message.sender.id);
    return {
      ...message,
      deliveredAt: message.deliveredAt || recipientReceipt?.deliveredAt || null,
      seenAt: message.seenAt || recipientReceipt?.seenAt || null,
      recalledAt: message.recalledAt || null,
      deletedAt: message.deletedAt || null,
      fileName: message.fileName || null,
      mimeType: message.mimeType || null,
      fileSize: message.fileSize || null,
      durationSeconds: message.durationSeconds || null,
      pinnedAt: message.pinnedAt || null,
      forwardedFromMessage: message.forwardedFromMessage ? {
        id: message.forwardedFromMessage.id,
        textContent: message.forwardedFromMessage.textContent || null,
        mediaUrl: message.forwardedFromMessage.mediaUrl || null,
        fileName: message.forwardedFromMessage.fileName || null,
        mimeType: message.forwardedFromMessage.mimeType || null,
        messageType: message.forwardedFromMessage.messageType,
        sender: message.forwardedFromMessage.sender
      } : null,
      parentMessage: message.parentMessage ? {
        id: message.parentMessage.id,
        textContent: message.parentMessage.textContent || null,
        mediaUrl: message.parentMessage.mediaUrl || null,
        sender: message.parentMessage.sender,
        recalledAt: message.parentMessage.recalledAt || null,
        deletedAt: message.parentMessage.deletedAt || null,
        messageType: message.parentMessage.messageType
      } : null,
      reactions: this.groupReactions(message.reactions || [], currentUserId)
    };
  }

  private groupReactions(reactions: any[], currentUserId: string) {
    const grouped = new Map<
      string,
      { emoji: string; count: number; reacted: boolean; users: { id: string; displayName: string }[] }
    >();
    reactions.forEach((reaction) => {
      const existing =
        grouped.get(reaction.emoji) ??
        ({
          emoji: reaction.emoji,
          count: 0,
          reacted: false,
          users: [] as { id: string; displayName: string }[]
        });
      existing.count += 1;
      existing.users.push(reaction.user);
      if (currentUserId && reaction.userId === currentUserId) existing.reacted = true;
      grouped.set(reaction.emoji, existing);
    });
    return Array.from(grouped.values());
  }

  private async assertParticipant(currentUserId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { userId: currentUserId } } },
      include: { participants: true }
    });
    if (!conversation) throw new ForbiddenException('Conversation not found');
    return conversation;
  }
}
