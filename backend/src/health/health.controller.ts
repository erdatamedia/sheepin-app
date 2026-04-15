import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateHealthDto } from './dto/create-health.dto';
import { UpdateHealthDto } from './dto/update-health.dto';
import { HealthService } from './health.service';

@Controller('health')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  create(
    @Body() dto: CreateHealthDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.healthService.create(dto, user);
  }

  @Get('sheep/:sheepId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findBySheepId(
    @Param('sheepId') sheepId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.healthService.findBySheepId(sheepId, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findOne(@Param('id') id: string) {
    return this.healthService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHealthDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.healthService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.healthService.remove(id, user);
  }
}
