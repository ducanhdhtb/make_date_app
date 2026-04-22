import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { GroupMessagesService } from './group-messages.service';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { ListGroupMessagesQueryDto } from './dto/list-group-messages.query.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { CloudinaryService } from '../upload/cloudinary.service';

@Controller('group-conversations/:groupId/messages')
@UseGuards(JwtAuthGuard)
export class GroupMessagesController {
  constructor(
    private readonly service: GroupMessagesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post()
  sendMessage(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Body() dto: CreateGroupMessageDto,
  ) {
    return this.service.sendMessage(userId, groupId, dto);
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async sendImage(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGroupMessageDto,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    const uploadResult = await this.cloudinary.uploadImage(file, 'group-messages');
    return this.service.sendImage(userId, groupId, uploadResult.url, dto);
  }

  @Post('attachment')
  @UseInterceptors(FileInterceptor('file'))
  async sendAttachment(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateGroupMessageDto,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    const uploadResult = await this.cloudinary.uploadResource(file, 'group-attachments');
    return this.service.sendImage(userId, groupId, uploadResult.url, dto);
  }

  @Get()
  getMessages(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Query() query: ListGroupMessagesQueryDto,
  ) {
    return this.service.getMessages(userId, groupId, query);
  }

  @Delete(':messageId')
  deleteMessage(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.service.deleteMessage(userId, groupId, messageId);
  }

  @Patch(':messageId/recall')
  recallMessage(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.service.recallMessage(userId, groupId, messageId);
  }

  @Post(':messageId/reactions')
  addReaction(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.service.addReaction(userId, groupId, messageId, dto.emoji);
  }

  @Delete(':messageId/reactions/:emoji')
  removeReaction(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    return this.service.removeReaction(userId, groupId, messageId, emoji);
  }

  @Patch(':messageId/pin')
  pinMessage(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.service.pinMessage(userId, groupId, messageId);
  }

  @Delete(':messageId/pin')
  unpinMessage(
    @CurrentUser() userId: string,
    @Param('groupId') groupId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.service.unpinMessage(userId, groupId, messageId);
  }
}
