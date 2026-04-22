import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUserId: string, dto: CreateReportDto) {
    if (!dto.reportedUserId && !dto.targetId) {
      throw new BadRequestException('reportedUserId or targetId is required');
    }

    return this.prisma.report.create({
      data: {
        reporterUserId: currentUserId,
        reportedUserId: dto.reportedUserId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details
      }
    });
  }

  listMine(currentUserId: string) {
    return this.prisma.report.findMany({
      where: { reporterUserId: currentUserId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
