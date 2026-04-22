import { IsString, IsOptional, IsArray, MinLength, MaxLength, ArrayMinSize } from 'class-validator';

export class CreateGroupConversationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  memberIds: string[];
}
