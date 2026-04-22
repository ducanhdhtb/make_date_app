import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { DiscoverQueryDto, UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new NotFoundException('User not found');

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          displayName: dto.displayName,
          bio: dto.bio,
          jobTitle: dto.jobTitle,
          city: dto.city,
          latitude: dto.latitude !== undefined ? new Prisma.Decimal(dto.latitude) : undefined,
          longitude: dto.longitude !== undefined ? new Prisma.Decimal(dto.longitude) : undefined,
          isLocationPrecise: dto.isLocationPrecise,
          isStoryPublic: dto.isStoryPublic,
          lastActiveAt: new Date()
        },
        include: {
          interests: true,
          photos: { orderBy: { sortOrder: 'asc' } }
        }
      });

      if (dto.interests) {
        await tx.userInterest.deleteMany({ where: { userId } });
        await tx.userInterest.createMany({
          data: dto.interests.map((interestName) => ({ userId, interestName }))
        });
      }

      return tx.user.findUnique({
        where: { id: updated.id },
        include: { interests: true, photos: { orderBy: { sortOrder: 'asc' } } }
      });
    });

    return { message: 'Profile updated', user };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const upload = await this.cloudinaryService.uploadImage(file, 'dating-app/avatar');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: upload.url },
      select: { id: true, avatarUrl: true }
    });
    return { message: 'Avatar uploaded', user, asset: upload };
  }

  async addPhoto(userId: string, file: Express.Multer.File) {
    const upload = await this.cloudinaryService.uploadImage(file, 'dating-app/profile');
    const currentCount = await this.prisma.userPhoto.count({ where: { userId } });
    const photo = await this.prisma.userPhoto.create({
      data: {
        userId,
        photoUrl: upload.url,
        sortOrder: currentCount + 1
      }
    });
    return { message: 'Photo uploaded', photo, asset: upload };
  }

  async discover(currentUserId: string, query: DiscoverQueryDto) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        latitude: { not: null },
        longitude: { not: null },
        ...(query.gender ? { gender: query.gender as any } : {})
      },
      include: {
        interests: true,
        stories: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      take: 50
    });

    return users
      .map((user) => {
        const age = this.getAge(user.birthDate);
        const distanceKm = this.haversineKm(
          query.lat,
          query.lng,
          Number(user.latitude),
          Number(user.longitude)
        );
        return { user, age, distanceKm };
      })
      .filter(({ age, distanceKm }) => {
        const ageOk = (query.ageFrom === undefined || age >= query.ageFrom) && (query.ageTo === undefined || age <= query.ageTo);
        return ageOk && distanceKm <= query.radius;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .map(({ user, age, distanceKm }) => ({
        id: user.id,
        displayName: user.displayName,
        age,
        jobTitle: user.jobTitle,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        distanceKm: Number(distanceKm.toFixed(1)),
        interests: user.interests.map((item) => item.interestName),
        latestStory: user.stories[0] || null,
        lastActiveAt: user.lastActiveAt
      }));
  }

  async findOne(currentUserId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        interests: true,
        stories: { where: { expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
    if (!user) throw new NotFoundException('User not found');

    let distanceKm: number | null = null;
    const me = await this.prisma.user.findUnique({ where: { id: currentUserId }, select: { latitude: true, longitude: true } });
    if (me?.latitude && me.longitude && user.latitude && user.longitude) {
      distanceKm = this.haversineKm(Number(me.latitude), Number(me.longitude), Number(user.latitude), Number(user.longitude));
    }

    return {
      id: user.id,
      displayName: user.displayName,
      age: this.getAge(user.birthDate),
      gender: user.gender,
      jobTitle: user.jobTitle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      photos: user.photos,
      interests: user.interests.map((item) => item.interestName),
      distanceKm: distanceKm ? Number(distanceKm.toFixed(1)) : null,
      latestStory: user.stories[0] || null
    };
  }

  private getAge(birthDate: Date) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const toRad = (value: number) => value * (Math.PI / 180);
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }
}
