import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyMatches(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        status: 'active',
        OR: [{ user1Id: userId }, { user2Id: userId }]
      },
      include: {
        user1: { select: { id: true, displayName: true, avatarUrl: true } },
        user2: { select: { id: true, displayName: true, avatarUrl: true } }
      },
      orderBy: { matchedAt: 'desc' }
    });

    return matches.map((match) => {
      const other = match.user1Id === userId ? match.user2 : match.user1;
      return {
        id: match.id,
        user: other,
        matchedAt: match.matchedAt,
        status: match.status
      };
    });
  }
}
