import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MapService } from './map.service';

@Controller('map')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('distribution')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  distribution() {
    return this.mapService.distribution();
  }
}
