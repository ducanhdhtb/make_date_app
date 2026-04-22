import { IsUUID, IsEnum, IsOptional } from 'class-validator';

export enum CallType {
  video = 'video',
  voice = 'voice',
}

export class CreateCallDto {
  @IsUUID()
  conversationId!: string;

  @IsUUID()
  receiverId!: string;

  @IsEnum(CallType)
  callType!: CallType;
}

export class UpdateCallDto {
  @IsOptional()
  @IsEnum(['ringing', 'connected', 'ended', 'missed', 'rejected'])
  status?: string;
}

export class ListCallsQueryDto {
  page?: number;
  limit?: number;
  callType?: 'video' | 'voice';
  status?: 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected';
}
