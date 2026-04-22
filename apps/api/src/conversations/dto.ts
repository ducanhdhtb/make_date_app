import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  targetUserId!: string;
}

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsIn(['text','image','file','audio'])
  messageType?: 'text' | 'image' | 'file' | 'audio';

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fileSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  durationSeconds?: number;

  @IsOptional()
  @IsUUID()
  forwardedFromMessageId?: string;

  @IsOptional()
  @IsUUID()
  parentMessageId?: string;
}

export class UploadChatImageDto {
  @IsOptional()
  @IsString()
  textContent?: string;

  @IsOptional()
  @IsUUID()
  parentMessageId?: string;
}

export class ForwardMessageDto {
  @IsUUID()
  targetConversationId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ListMessagesQueryDto {
  @IsOptional()
  @IsDateString()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  q?: string;
}

export class ToggleReactionDto {
  @IsString()
  emoji!: string;
}

export class MessageActionDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class PinMessageDto {
  @IsOptional()
  @IsString()
  note?: string;
}
