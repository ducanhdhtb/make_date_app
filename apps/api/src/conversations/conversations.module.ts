import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [RealtimeModule, UploadModule],
  controllers: [ConversationsController],
  providers: [ConversationsService]
})
export class ConversationsModule {}
