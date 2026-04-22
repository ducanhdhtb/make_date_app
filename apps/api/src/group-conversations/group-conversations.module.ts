import { Module } from '@nestjs/common';
import { GroupConversationsService } from './group-conversations.service';
import { GroupConversationsController } from './group-conversations.controller';

@Module({
  controllers: [GroupConversationsController],
  providers: [GroupConversationsService],
  exports: [GroupConversationsService],
})
export class GroupConversationsModule {}
