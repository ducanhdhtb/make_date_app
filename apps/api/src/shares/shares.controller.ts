import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SharesService } from './shares.service';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user';
import { CreateShareDto } from './dto';

@Controller()
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post('shares')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateShareDto) {
    return this.sharesService.create(user.sub, dto);
  }

  @Get('share/profile/:id')
  publicProfile(@Param('id') id: string) {
    return this.sharesService.publicProfile(id);
  }

  @Get('share/story/:id')
  publicStory(@Param('id') id: string) {
    return this.sharesService.publicStory(id);
  }
}
