import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StoriesService } from './stories.service';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user';
import { CreateStoryDto } from './dto';

@Controller()
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post('stories')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateStoryDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.storiesService.create(user.sub, dto, file);
  }

  @Get('stories/feed')
  @UseGuards(JwtAuthGuard)
  feed() {
    return this.storiesService.feed();
  }

  @Get('users/:id/stories')
  @UseGuards(JwtAuthGuard)
  byUser(@Param('id') id: string) {
    return this.storiesService.byUser(id);
  }

  @Delete('stories/:id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.storiesService.remove(user.sub, id);
  }
}
