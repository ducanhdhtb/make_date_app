import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBlockDto {
  @IsUUID()
  targetUserId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
