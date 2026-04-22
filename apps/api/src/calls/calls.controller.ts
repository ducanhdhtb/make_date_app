import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateCallDto, UpdateCallDto, ListCallsQueryDto } from './dto/create-call.dto';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  async createCall(@Request() req: any, @Body() dto: CreateCallDto) {
    return this.callsService.createCall(req.user.id, dto);
  }

  @Get()
  async getCallHistory(@Request() req: any, @Query() query: ListCallsQueryDto) {
    return this.callsService.getCallHistory(req.user.id, query);
  }

  @Get(':id')
  async getCallById(@Request() req: any, @Param('id') id: string) {
    return this.callsService.getCallById(req.user.id, id);
  }

  @Patch(':id')
  async updateCallStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCallDto,
  ) {
    return this.callsService.updateCallStatus(req.user.id, id, dto);
  }

  @Post(':id/end')
  async endCall(@Request() req: any, @Param('id') id: string) {
    return this.callsService.endCall(req.user.id, id);
  }
}
