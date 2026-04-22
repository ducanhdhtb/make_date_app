import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallDto, UpdateCallDto, ListCallsQueryDto } from './dto/create-call.dto';

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCall(currentUserId: string, dto: CreateCallDto) {
    // Check if conversation exists and user is participant
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: currentUserId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant of this conversation');
    }

    // Check if receiver is also participant
    const receiverParticipant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: dto.receiverId,
        },
      },
    });

    if (!receiverParticipant) {
      throw new BadRequestException('Receiver is not a participant of this conversation');
    }

    // Create call
    const call = await this.prisma.call.create({
      data: {
        conversationId: dto.conversationId,
        callerId: currentUserId,
        receiverId: dto.receiverId,
        callType: dto.callType,
        status: 'ringing',
      },
      include: {
        caller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        conversation: true,
      },
    });

    return call;
  }

  async getCallHistory(currentUserId: string, query: ListCallsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { callerId: currentUserId },
        { receiverId: currentUserId },
      ],
    };

    if (query.callType) {
      where.callType = query.callType;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [calls, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        include: {
          caller: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.call.count({ where }),
    ]);

    return {
      data: calls,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getCallById(currentUserId: string, callId: string) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        conversation: true,
      },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Check if user is caller or receiver
    if (call.callerId !== currentUserId && call.receiverId !== currentUserId) {
      throw new ForbiddenException('You are not authorized to view this call');
    }

    return call;
  }

  async updateCallStatus(currentUserId: string, callId: string, dto: UpdateCallDto) {
    const call = await this.getCallById(currentUserId, callId);

    // Only caller or receiver can update
    if (call.callerId !== currentUserId && call.receiverId !== currentUserId) {
      throw new ForbiddenException('You are not authorized to update this call');
    }

    const updateData: any = { status: dto.status };

    // If call is connected, set startedAt
    if (dto.status === 'connected' && !call.startedAt) {
      updateData.startedAt = new Date();
    }

    // If call is ended, calculate duration
    if (dto.status === 'ended' && call.startedAt) {
      const endedAt = new Date();
      const durationSeconds = Math.floor((endedAt.getTime() - call.startedAt.getTime()) / 1000);
      updateData.endedAt = endedAt;
      updateData.durationSeconds = durationSeconds;
    }

    return this.prisma.call.update({
      where: { id: callId },
      data: updateData,
      include: {
        caller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async endCall(currentUserId: string, callId: string) {
    return this.updateCallStatus(currentUserId, callId, { status: 'ended' });
  }
}
