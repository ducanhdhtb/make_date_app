import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  listMine(currentUserId: string) {
    return this.prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markAllRead(currentUserId: string) {
    const readAt = new Date();
    const result = await this.prisma.notification.updateMany({
      where: { userId: currentUserId, isRead: false },
      data: { isRead: true, readAt }
    });

    this.realtimeGateway.emitNotificationsReadAll(currentUserId, {
      userId: currentUserId,
      updated: result.count,
      readAt: readAt.toISOString()
    });

    return { updated: result.count };
  }
}
