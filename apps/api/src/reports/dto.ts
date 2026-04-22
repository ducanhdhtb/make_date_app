import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @IsString()
  targetType!: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  details?: string;
}
