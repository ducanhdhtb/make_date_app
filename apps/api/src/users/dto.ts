import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() jobTitle?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @IsOptional() @IsBoolean() isLocationPrecise?: boolean;
  @IsOptional() @IsBoolean() isStoryPublic?: boolean;
  @IsOptional() @IsArray() interests?: string[];
}

export class DiscoverQueryDto {
  @Type(() => Number) @IsNumber() lat!: number;
  @Type(() => Number) @IsNumber() lng!: number;
  @Type(() => Number) @IsNumber() radius!: number;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @Type(() => Number) @IsNumber() ageFrom?: number;
  @IsOptional() @Type(() => Number) @IsNumber() ageTo?: number;
}
