import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateStoryDto {
  @IsIn(['image', 'text'])
  mediaType!: 'image' | 'text';

  @IsOptional() @IsString() textContent?: string;
  @IsOptional() @IsString() caption?: string;
}
