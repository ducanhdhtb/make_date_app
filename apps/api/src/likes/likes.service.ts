import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLikeDto } from './dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway
  ) {}

  async create(currentUserId: string, dto: CreateLikeDto) {
    if (currentUserId === dto.targetUserId) {
      throw new BadRequestException('Cannot like yourself');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: dto.targetUserId } });
    if (!targetUser) throw new BadRequestException('Target user not found');

    const existing = await this.prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: currentUserId, toUserId: dto.targetUserId } }
    });
    if (existing) throw new ConflictException('Already liked');

    const reverseLike = await this.prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: dto.targetUserId, toUserId: currentUserId } }
    });

    const like = await this.prisma.like.create({
      data: { fromUserId: currentUserId, toUserId: dto.targetUserId }
    });

    const likeNotification = await this.prisma.notification.create({
      data: {
        userId: dto.targetUserId,
        type: 'new_like',
        title: 'Bạn có lượt thích mới',
        body: 'Ai đó vừa thả tim cho bạn.',
        data: { fromUserId: currentUserId } as never
      }
    });
    this.realtimeGateway.emitNotificationCreated(dto.targetUserId, likeNotification);

    if (reverseLike) {
      const pair = [currentUserId, dto.targetUserId].sort();
      const match = await this.prisma.match.upsert({
        where: { user1Id_user2Id: { user1Id: pair[0], user2Id: pair[1] } },
        update: { status: 'active' },
        create: { user1Id: pair[0], user2Id: pair[1], status: 'active' }
      });

      const notifications = await Promise.all(
        [currentUserId, dto.targetUserId].map((userId) =>
          this.prisma.notification.create({
            data: {
              userId,
              type: 'match_created',
              title: 'Bạn đã ghép đôi',
              body: 'Hai bạn đã cùng thả tim cho nhau.',
              data: { matchId: match.id, userIds: [currentUserId, dto.targetUserId] } as never
            }
          })
        )
      );

      notifications.forEach((notification) => {
        this.realtimeGateway.emitNotificationCreated(notification.userId, notification);
      });
      this.realtimeGateway.emitMatchCreated([currentUserId, dto.targetUserId], {
        matchId: match.id,
        userIds: [currentUserId, dto.targetUserId]
      });

      return { liked: true, matched: true, like, match, message: "It's a match" };
    }

    return { liked: true, matched: false, like, message: 'Liked successfully' };
  }
}
