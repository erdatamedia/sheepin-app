import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';
import { VerifySheepDto } from './dto/verify-sheep.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ---- Publik (tanpa login) ----

  @Get()
  list(
    @Query('search') search?: string,
    @Query('breed') breed?: string,
    @Query('gender') gender?: string,
  ) {
    return this.catalogService.list({ search, breed, gender });
  }

  // ---- Admin dan petugas ----

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  pending() {
    return this.catalogService.pending();
  }

  @Patch('verify/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  verify(
    @Param('id') id: string,
    @Body() dto: VerifySheepDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.catalogService.setVerified(id, dto, user);
  }

  // Rute berparameter terakhir agar tidak menimpa 'pending'.
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.catalogService.detail(id);
  }
}
