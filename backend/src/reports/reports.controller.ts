import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportMailService } from './report-mail.service';
import { ReportWorkbookService } from './report-workbook.service';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly workbook: ReportWorkbookService,
    private readonly mail: ReportMailService,
  ) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  overview(@Query() query: ReportQueryDto) {
    return this.reportsService.overview(query);
  }

  /** Apresiasi peternak. Peternak hanya melihat miliknya; petugas wajib menyebut farmerId. */
  @Get('achievements')
  @Roles(UserRole.FARMER, UserRole.ADMIN, UserRole.OFFICER)
  achievements(
    @CurrentUser() user: { id: string; role: UserRole },
    @Query() query: ReportQueryDto,
  ) {
    const farmerId = user.role === UserRole.FARMER ? user.id : query.farmerId;
    if (!farmerId)
      throw new ForbiddenException('Pilih peternak terlebih dahulu.');
    return this.reportsService.achievements(farmerId, query);
  }

  /** Unduh rekapitulasi Excel (tanpa data kontak). Tanpa `from` = sejak awal sampai saat ini. */
  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  async export(@Query() query: ReportQueryDto) {
    const report = await this.workbook.build(query);
    return new StreamableFile(report.buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${report.filename}"`,
    });
  }

  @Get('schedule')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  schedule() {
    return this.mail.status();
  }

  /** Kirim laporan sekarang ke penerima di server (uji coba). */
  @Post('send-now')
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async sendNow() {
    const result = await this.mail.sendNow('manual');
    return { message: result.message, data: result };
  }
}
