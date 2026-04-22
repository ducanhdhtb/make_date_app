import { Module } from '@nestjs/common';
import { GroupMessagesService } from './group-messages.service';
import { GroupMessagesController } from './group-messages.controller';
import { UploadModule } from '../upload/upload.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [UploadModule, RealtimeModule],
  controllers: [GroupMessagesController],
  providers: [GroupMessagesService],
  exports: [GroupMessagesService],
})
export class GroupMessagesModule {}
