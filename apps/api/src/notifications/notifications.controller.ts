import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferencesDto, PushSubscriptionDto } from './dto/notification-preferences.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ============ NOTIFICATIONS ============

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.notificationsService.listMine(user.sub);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Post(':id/read')
  markAsRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.sub, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllRead(user.sub);
  }

  // ============ PREFERENCES ============

  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNotificationPreferencesDto
  ) {
    return this.notificationsService.updatePreferences(user.sub, dto);
  }

  // ============ PUSH SUBSCRIPTIONS ============

  @Post('subscribe')
  subscribePush(
    @CurrentUser() user: AuthUser,
    @Body() dto: PushSubscriptionDto
  ) {
    return this.notificationsService.subscribePush(user.sub, dto);
  }

  @Delete('subscribe')
  unsubscribePush(
    @CurrentUser() user: AuthUser,
    @Body('endpoint') endpoint: string
  ) {
    return this.notificationsService.unsubscribePush(user.sub, endpoint);
  }
}
