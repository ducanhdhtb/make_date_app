import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const age = this.getAge(dto.birthDate);
    if (age < 18) throw new BadRequestException('User must be at least 18 years old');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        interestedIn: dto.interestedIn,
        lastActiveAt: new Date()
      }
    });

    return this.buildAuthResponse(user.id, user.email, user.displayName);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    return this.buildAuthResponse(user.id, user.email, user.displayName);
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        bio: true,
        jobTitle: true,
        avatarUrl: true,
        city: true,
        gender: true,
        interestedIn: true,
        latitude: true,
        longitude: true,
        isLocationPrecise: true,
        isStoryPublic: true,
        interests: { select: { interestName: true } },
        photos: { orderBy: { sortOrder: 'asc' } }
      }
    });
  }

  private buildAuthResponse(id: string, email: string, displayName: string) {
    const accessToken = this.jwtService.sign({ sub: id, email });
    return {
      accessToken,
      user: { id, email, displayName }
    };
  }

  private getAge(dateString: string) {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
  }
}
