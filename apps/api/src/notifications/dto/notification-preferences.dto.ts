import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  newMatch?: boolean;

  @IsOptional()
  @IsBoolean()
  newMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  newLike?: boolean;

  @IsOptional()
  @IsBoolean()
  incomingCall?: boolean;

  @IsOptional()
  @IsBoolean()
  missedCall?: boolean;

  @IsOptional()
  @IsBoolean()
  storyReaction?: boolean;

  @IsOptional()
  @IsBoolean()
  groupMessage?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;
}

export class PushSubscriptionDto {
  endpoint!: string;
  p256dh!: string;
  auth!: string;
  userAgent?: string;
}
