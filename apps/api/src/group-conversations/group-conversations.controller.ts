import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { GroupConversationsService } from './group-conversations.service';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { UpdateGroupConversationDto } from './dto/update-group-conversation.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ListGroupsQueryDto } from './dto/list-groups.query.dto';
import { ListMembersQueryDto } from './dto/list-members.query.dto';

@Controller('group-conversations')
@UseGuards(JwtAuthGuard)
export class GroupConversationsController {
  constructor(private readonly service: GroupConversationsService) {}

  @Post()
  create(
    @CurrentUser() userId: string,
    @Body() dto: CreateGroupConversationDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() userId: string,
    @Query() query: ListGroupsQueryDto,
  ) {
    return this.service.findAll(userId, query);
  }

  @Get(':id')
  findById(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
  ) {
    return this.service.findById(userId, groupId);
  }

  @Put(':id')
  update(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Body() dto: UpdateGroupConversationDto,
  ) {
    return this.service.update(userId, groupId, dto);
  }

  @Delete(':id')
  delete(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
  ) {
    return this.service.delete(userId, groupId);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.addMember(userId, groupId, dto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.service.removeMember(userId, groupId, memberId);
  }

  @Get(':id/members')
  getMembers(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Query() query: ListMembersQueryDto,
  ) {
    return this.service.getMembers(userId, groupId, query);
  }

  @Post(':id/leave')
  leaveGroup(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
  ) {
    return this.service.leaveGroup(userId, groupId);
  }
}
