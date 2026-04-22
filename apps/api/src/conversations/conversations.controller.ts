import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, CreateMessageDto, ForwardMessageDto, ListMessagesQueryDto, ToggleReactionDto } from './dto';
import { CloudinaryService } from '../upload/cloudinary.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(user.sub, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.conversationsService.listMine(user.sub);
  }

  @Get(':conversationId/messages')
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Query() query: ListMessagesQueryDto
  ) {
    return this.conversationsService.listMessages(user.sub, conversationId, query);
  }

  @Post(':conversationId/messages')
  createMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto
  ) {
    return this.conversationsService.createMessage(user.sub, conversationId, dto);
  }

  @Post(':conversationId/messages/image')
  @UseInterceptors(FileInterceptor('file'))
  async createImageMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('textContent') textContent?: string,
    @Body('parentMessageId') parentMessageId?: string
  ) {
    const upload = await this.cloudinaryService.uploadImage(file, 'nearmatch/chat');
    return this.conversationsService.createMessage(user.sub, conversationId, {
      textContent,
      mediaUrl: upload.url,
      parentMessageId,
      messageType: 'image',
      fileName: file?.originalname,
      mimeType: file?.mimetype,
      fileSize: file?.size
    });
  }

  @Post(':conversationId/messages/attachment')
  @UseInterceptors(FileInterceptor('file'))
  async createAttachmentMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('textContent') textContent?: string,
    @Body('parentMessageId') parentMessageId?: string
  ) {
    const upload = await this.cloudinaryService.uploadResource(file, 'nearmatch/chat', 'auto');
    const inferredType = file?.mimetype?.startsWith('audio/') ? 'audio' : 'file';
    return this.conversationsService.createMessage(user.sub, conversationId, {
      textContent,
      mediaUrl: upload.url,
      parentMessageId,
      messageType: inferredType as 'audio' | 'file',
      fileName: file?.originalname,
      mimeType: file?.mimetype,
      fileSize: file?.size
    });
  }

  @Get(':conversationId/pins')
  listPins(@CurrentUser() user: AuthUser, @Param('conversationId') conversationId: string) {
    return this.conversationsService.listPins(user.sub, conversationId);
  }

  @Patch(':conversationId/messages/:messageId/pin')
  pinMessage(@CurrentUser() user: AuthUser, @Param('conversationId') conversationId: string, @Param('messageId') messageId: string) {
    return this.conversationsService.pinMessage(user.sub, conversationId, messageId);
  }

  @Delete(':conversationId/messages/:messageId/pin')
  unpinMessage(@CurrentUser() user: AuthUser, @Param('conversationId') conversationId: string, @Param('messageId') messageId: string) {
    return this.conversationsService.unpinMessage(user.sub, conversationId, messageId);
  }

  @Post(':conversationId/messages/:messageId/forward')
  forwardMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ForwardMessageDto
  ) {
    return this.conversationsService.forwardMessage(user.sub, conversationId, messageId, dto);
  }

  @Post(':conversationId/messages/:messageId/reactions')
  addReaction(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ToggleReactionDto
  ) {
    return this.conversationsService.addReaction(user.sub, conversationId, messageId, dto.emoji);
  }

  @Delete(':conversationId/messages/:messageId/reactions/:emoji')
  removeReaction(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string
  ) {
    return this.conversationsService.removeReaction(user.sub, conversationId, messageId, emoji);
  }

  @Patch(':conversationId/messages/:messageId/recall')
  recallMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string
  ) {
    return this.conversationsService.recallMessage(user.sub, conversationId, messageId);
  }

  @Delete(':conversationId/messages/:messageId')
  deleteMessage(
    @CurrentUser() user: AuthUser,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string
  ) {
    return this.conversationsService.deleteMessage(user.sub, conversationId, messageId);
  }
}
