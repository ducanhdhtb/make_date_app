import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { CreateStoryDto } from './dto';

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(userId: string, dto: CreateStoryDto, file?: Express.Multer.File) {
    let mediaUrl: string | null = null;
    if (dto.mediaType === 'image') {
      if (!file) throw new BadRequestException('Image file is required for image story');
      const upload = await this.cloudinaryService.uploadImage(file, 'dating-app/stories');
      mediaUrl = upload.url;
    }

    if (dto.mediaType === 'text' && !dto.textContent) {
      throw new BadRequestException('Text content is required for text story');
    }

    return this.prisma.story.create({
      data: {
        userId,
        mediaType: dto.mediaType,
        mediaUrl,
        textContent: dto.textContent || null,
        caption: dto.caption || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  async feed() {
    return this.prisma.story.findMany({
      where: { expiresAt: { gt: new Date() } },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async byUser(userId: string) {
    return this.prisma.story.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(userId: string, id: string) {
    const story = await this.prisma.story.findFirst({ where: { id, userId } });
    if (!story) throw new NotFoundException('Story not found');
    await this.prisma.story.delete({ where: { id } });
    return { message: 'Story deleted' };
  }
}
