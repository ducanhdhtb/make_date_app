import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateLikeDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLikeDto) {
    return this.likesService.create(user.sub, dto);
  }
}
