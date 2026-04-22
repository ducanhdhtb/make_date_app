import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { ListGroupMessagesQueryDto } from './dto/list-group-messages.query.dto';
import { AddReactionDto } from './dto/add-reaction.dto';

@Injectable()
export class GroupMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async sendMessage(
    currentUserId: string,
    groupId: string,
    dto: CreateGroupMessageDto,
  ) {
    // Check if user is member
    const member = await this.prisma.groupConversationMember.findUnique({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId: currentUserId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Validate message
    if (!dto.textContent || dto.textContent.trim().length === 0) {
      throw new BadRequestException('Message content is required');
    }

    // Check if parent message exists (if replying)
    if (dto.parentMessageId) {
      const parentMessage = await this.prisma.groupMessage.findUnique({
        where: { id: dto.parentMessageId },
      });

      if (!parentMessage || parentMessage.groupConversationId !== groupId) {
        throw new NotFoundException('Parent message not found');
      }
    }

    const message = await this.prisma.groupMessage.create({
      data: {
        groupConversationId: groupId,
        senderUserId: currentUserId,
        textContent: dto.textContent,
        parentMessageId: dto.parentMessageId,
        messageType: 'text',
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        parentMessage: {
          select: {
            id: true,
            textContent: true,
            sender: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    // Emit new message event
    this.realtimeGateway.emitGroupMessageCreated(groupId, {
      groupConversationId: groupId,
      message,
    });

    return message;
  }

  async sendImage(
    currentUserId: string,
    groupId: string,
    mediaUrl: string,
    dto: CreateGroupMessageDto,
  ) {
    // Check if user is member
    const member = await this.prisma.groupConversationMember.findUnique({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId: currentUserId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Check if parent message exists (if replying)
    if (dto.parentMessageId) {
      const parentMessage = await this.prisma.groupMessage.findUnique({
        where: { id: dto.parentMessageId },
      });

      if (!parentMessage || parentMessage.groupConversationId !== groupId) {
        throw new NotFoundException('Parent message not found');
      }
    }

    const message = await this.prisma.groupMessage.create({
      data: {
        groupConversationId: groupId,
        senderUserId: currentUserId,
        mediaUrl,
        textContent: dto.textContent,
        parentMessageId: dto.parentMessageId,
        messageType: 'image',
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reactions: true,
        parentMessage: true,
      },
    });

    // Emit new message event
    this.realtimeGateway.emitGroupMessageCreated(groupId, {
      groupConversationId: groupId,
      message,
    });

    return message;
  }

  async getMessages(
    currentUserId: string,
    groupId: string,
    query: ListGroupMessagesQueryDto,
  ) {
    // Check if user is member
    const member = await this.prisma.groupConversationMember.findUnique({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId: currentUserId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const limit = query.limit || 20;
    const where: any = {
      groupConversationId: groupId,
      deletedAt: null,
    };

    if (query.search) {
      where.textContent = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.before) {
      where.createdAt = {
        lt: new Date(query.before),
      };
    }

    const messages = await this.prisma.groupMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
        parentMessage: {
          select: {
            id: true,
            textContent: true,
            sender: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const items = messages.slice(0, limit).reverse();
    const nextCursor = hasMore ? messages[limit].createdAt.toISOString() : null;

    return {
      items,
      hasMore,
      nextCursor,
    };
  }

  async deleteMessage(
    currentUserId: string,
    groupId: string,
    messageId: string,
  ) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.groupConversationId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderUserId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const deletedMessage = await this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      include: {
        sender: true,
        reactions: true,
      },
    });

    // Emit message updated event
    this.realtimeGateway.emitGroupMessageUpdated(groupId, {
      groupConversationId: groupId,
      message: deletedMessage,
      action: 'deleted',
    });

    return deletedMessage;
  }

  async recallMessage(
    currentUserId: string,
    groupId: string,
    messageId: string,
  ) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.groupConversationId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderUserId !== currentUserId) {
      throw new ForbiddenException('You can only recall your own messages');
    }

    const recalledMessage = await this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { recalledAt: new Date() },
      include: {
        sender: true,
        reactions: true,
      },
    });

    // Emit message updated event
    this.realtimeGateway.emitGroupMessageUpdated(groupId, {
      groupConversationId: groupId,
      message: recalledMessage,
      action: 'recalled',
    });

    return recalledMessage;
  }

  async addReaction(
    currentUserId: string,
    groupId: string,
    messageId: string,
    emoji: string,
  ) {
    // Check if user is member
    const member = await this.prisma.groupConversationMember.findUnique({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId: currentUserId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Check if message exists
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.groupConversationId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    // Add reaction
    await this.prisma.groupMessageReaction.upsert({
      where: {
        groupMessageId_userId_emoji: {
          groupMessageId: messageId,
          userId: currentUserId,
          emoji,
        },
      },
      create: {
        groupMessageId: messageId,
        userId: currentUserId,
        emoji,
      },
      update: {},
    });

    // Get all reactions
    const reactions = await this.prisma.groupMessageReaction.findMany({
      where: { groupMessageId: messageId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    // Emit reaction updated event
    this.realtimeGateway.emitGroupMessageReactionUpdated(groupId, {
      groupConversationId: groupId,
      messageId,
      reactions,
    });

    return reactions;
  }

  async removeReaction(
    currentUserId: string,
    groupId: string,
    messageId: string,
    emoji: string,
  ) {
    // Check if message exists
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.groupConversationId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    // Remove reaction
    await this.prisma.groupMessageReaction.delete({
      where: {
        groupMessageId_userId_emoji: {
          groupMessageId: messageId,
          userId: currentUserId,
          emoji,
        },
      },
    });

    // Get remaining reactions
    const reactions = await this.prisma.groupMessageReaction.findMany({
      where: { groupMessageId: messageId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    // Emit reaction updated event
    this.realtimeGateway.emitGroupMessageReactionUpdated(groupId, {
      groupConversationId: groupId,
      messageId,
      reactions,
    });

    return reactions;
  }

  async pinMessage(
    currentUserId: string,
    groupId: string,
    messageId: string,
  ) {
    // Check if user is owner or admin
    const member = await this.prisma.groupConversationMember.findUnique({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId: currentUserId,
        },
      },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Only owner or admin can pin messages');
    }

    // Check if message exists
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.groupConversationId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    const pinnedMessage = await this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { pinnedAt: new Date() },
      include: {
        sender: true,
        reactions: true,
      },
    });

    // Emit message updated event
    this.realtimeGateway.emitGroupMessageUpdated(groupId, {
      groupConversationId: groupId,
      message: pinnedMessage,
      action: 'pinned',
    });

    return pinnedMessage;
  }

  async unpinMessage(
    currentUserId: string,
    groupId: string,
    messageId: string,
  ) {
    // Check if user is owner or admin
    const member = await this.prisma.groupConversationMember.findUnique({
      where: {
        groupConversationId_userId: {
          groupConversationId: groupId,
          userId: currentUserId,
        },
      },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Only owner or admin can unpin messages');
    }

    // Check if message exists
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.groupConversationId !== groupId) {
      throw new NotFoundException('Message not found');
    }

    const unpinnedMessage = await this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { pinnedAt: null },
      include: {
        sender: true,
        reactions: true,
      },
    });

    // Emit message updated event
    this.realtimeGateway.emitGroupMessageUpdated(groupId, {
      groupConversationId: groupId,
      message: unpinnedMessage,
      action: 'unpinned',
    });

    return unpinnedMessage;
  }
}
