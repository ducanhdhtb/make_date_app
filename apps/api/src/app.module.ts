import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LikesModule } from './likes/likes.module';
import { MatchesModule } from './matches/matches.module';
import { StoriesModule } from './stories/stories.module';
import { SharesModule } from './shares/shares.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadModule } from './upload/upload.module';
import { BlocksModule } from './blocks/blocks.module';
import { ReportsModule } from './reports/reports.module';
import { ConversationsModule } from './conversations/conversations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { GroupConversationsModule } from './group-conversations/group-conversations.module';
import { GroupMessagesModule } from './group-messages/group-messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    UploadModule,
    AuthModule,
    UsersModule,
    LikesModule,
    MatchesModule,
    StoriesModule,
    SharesModule,
    BlocksModule,
    ReportsModule,
    ConversationsModule,
    NotificationsModule,
    GroupConversationsModule,
    GroupMessagesModule,
  ]
})
export class AppModule {}
