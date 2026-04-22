import { IsIn, IsString } from 'class-validator';

export class CreateShareDto {
  @IsIn(['profile', 'story'])
  targetType!: 'profile' | 'story';

  @IsString()
  targetId!: string;

  @IsString()
  channel!: string;
}
