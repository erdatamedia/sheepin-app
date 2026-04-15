import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QuickRecordingDto } from './dto/quick-recording.dto';
import { RecordingHistoryService } from './recording-history.service';
import { RecordingService } from './recording.service';

@Controller('recording')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordingController {
  constructor(
    private readonly recordingService: RecordingService,
    private readonly recordingHistoryService: RecordingHistoryService,
  ) {}

  @Get('quick/sheep-options')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  sheepOptions(@CurrentUser() user: { id: string; role: UserRole }) {
    return this.recordingService.sheepOptions(user);
  }

  @Post('quick')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  quickRecord(
    @Body() dto: QuickRecordingDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.recordingService.quickRecord(dto, user);
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  history(@CurrentUser() user: { id: string; role: UserRole }) {
    return this.recordingHistoryService.findAll(user);
  }
}
