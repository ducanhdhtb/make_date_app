import { Module } from '@nestjs/common';
import { GroupConversationsService } from './group-conversations.service';
import { GroupConversationsController } from './group-conversations.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [GroupConversationsController],
  providers: [GroupConversationsService],
  exports: [GroupConversationsService],
})
export class GroupConversationsModule {}
