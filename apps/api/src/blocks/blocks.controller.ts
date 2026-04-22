import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto';

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBlockDto) {
    return this.blocksService.create(user.sub, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.blocksService.listMine(user.sub);
  }

  @Delete(':targetUserId')
  remove(@CurrentUser() user: AuthUser, @Param('targetUserId') targetUserId: string) {
    return this.blocksService.remove(user.sub, targetUserId);
  }
}
