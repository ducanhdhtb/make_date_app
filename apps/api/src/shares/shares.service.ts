import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto } from './dto';

@Injectable()
export class SharesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateShareDto) {
    const share = await this.prisma.share.create({
      data: { userId, targetType: dto.targetType, targetId: dto.targetId, channel: dto.channel }
    });
    return { message: 'Share logged', share };
  }

  async publicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { interests: true, photos: { orderBy: { sortOrder: 'asc' } } }
    });
    if (!user) throw new NotFoundException('Profile not found');
    return {
      type: 'profile',
      shareUrl: `/share/profile/${id}`,
      profile: {
        id: user.id,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        photos: user.photos,
        interests: user.interests.map((item) => item.interestName)
      }
    };
  }

  async publicStory(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } }
    });
    if (!story) throw new NotFoundException('Story not found');
    return {
      type: 'story',
      shareUrl: `/share/story/${id}`,
      story
    };
  }
}
