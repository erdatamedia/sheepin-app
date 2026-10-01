import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
}
