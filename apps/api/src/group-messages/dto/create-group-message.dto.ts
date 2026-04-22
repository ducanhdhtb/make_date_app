import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateGroupMessageDto {
  @IsString()
  @MaxLength(5000)
  textContent!: string;

  @IsOptional()
  @IsString()
  parentMessageId?: string;
}
