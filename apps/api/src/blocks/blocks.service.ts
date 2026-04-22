import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  async create(currentUserId: string, dto: CreateBlockDto) {
    if (currentUserId === dto.targetUserId) throw new BadRequestException('Cannot block yourself');

    const user = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
    if (!user) throw new BadRequestException('Target user not found');

    const block = await this.prisma.block.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: currentUserId,
          blockedUserId: dto.targetUserId
        }
      },
      update: { reason: dto.reason ?? null },
      create: {
        blockerUserId: currentUserId,
        blockedUserId: dto.targetUserId,
        reason: dto.reason
      }
    });

    const pair = [currentUserId, dto.targetUserId].sort();
    await this.prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: pair[0], user2Id: pair[1] } },
      update: { status: 'blocked' },
      create: { user1Id: pair[0], user2Id: pair[1], status: 'blocked' }
    });

    const notification = await this.prisma.notification.create({
      data: {
        userId: currentUserId,
        type: 'system',
        title: 'Đã chặn người dùng',
        body: 'Người dùng này sẽ không thể tiếp tục nhắn tin với bạn.',
        data: { blockedUserId: dto.targetUserId } as never
      }
    });
    this.realtimeGateway.emitNotificationCreated(currentUserId, notification);
    this.realtimeGateway.emitUserBlocked([currentUserId, dto.targetUserId], {
      blockerUserId: currentUserId,
      blockedUserId: dto.targetUserId
    });

    return { blocked: true, block };
  }

  listMine(currentUserId: string) {
    return this.prisma.block.findMany({
      where: { blockerUserId: currentUserId },
      include: {
        blocked: {
          select: { id: true, displayName: true, avatarUrl: true, city: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(currentUserId: string, targetUserId: string) {
    await this.prisma.block.delete({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId: currentUserId,
          blockedUserId: targetUserId
        }
      }
    });
    return { unblocked: true };
  }
}
