import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UpdateNotificationPreferencesDto, PushSubscriptionDto } from './dto/notification-preferences.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  // ============ NOTIFICATIONS ============

  listMine(currentUserId: string) {
    return this.prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUnreadCount(currentUserId: string) {
    const count = await this.prisma.notification.count({
      where: { userId: currentUserId, isRead: false }
    });
    return { count };
  }

  async markAsRead(currentUserId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId: currentUserId }
    });

    if (!notification) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() }
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

  // ============ NOTIFICATION PREFERENCES ============

  async getPreferences(currentUserId: string) {
    let preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId: currentUserId }
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await this.prisma.notificationPreferences.create({
        data: { userId: currentUserId }
      });
    }

    return preferences;
  }

  async updatePreferences(
    currentUserId: string,
    dto: UpdateNotificationPreferencesDto
  ) {
    // Ensure preferences exist
    await this.getPreferences(currentUserId);

    return this.prisma.notificationPreferences.update({
      where: { userId: currentUserId },
      data: dto
    });
  }

  // ============ PUSH SUBSCRIPTIONS ============

  async subscribePush(
    currentUserId: string,
    dto: PushSubscriptionDto
  ) {
    // Check if subscription already exists
    const existing = await this.prisma.pushSubscription.findFirst({
      where: { userId: currentUserId, endpoint: dto.endpoint }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.pushSubscription.create({
      data: {
        userId: currentUserId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        userAgent: dto.userAgent
      }
    });
  }

  async unsubscribePush(currentUserId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId: currentUserId, endpoint }
    });

    return { success: true };
  }

  async getPushSubscriptions(userId: string) {
    return this.prisma.pushSubscription.findMany({
      where: { userId }
    });
  }

  // ============ HELPER: Check if notification should be sent ============

  async shouldSendNotification(
    userId: string,
    notificationType: 'newMatch' | 'newMessage' | 'newLike' | 'incomingCall' | 'missedCall' | 'storyReaction' | 'groupMessage'
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);
    
    switch (notificationType) {
      case 'newMatch':
        return preferences.newMatch && preferences.pushEnabled;
      case 'newMessage':
        return preferences.newMessage && preferences.pushEnabled;
      case 'newLike':
        return preferences.newLike && preferences.pushEnabled;
      case 'incomingCall':
        return preferences.incomingCall && preferences.pushEnabled;
      case 'missedCall':
        return preferences.missedCall && preferences.pushEnabled;
      case 'storyReaction':
        return preferences.storyReaction && preferences.pushEnabled;
      case 'groupMessage':
        return preferences.groupMessage && preferences.pushEnabled;
      default:
        return false;
    }
  }
}
