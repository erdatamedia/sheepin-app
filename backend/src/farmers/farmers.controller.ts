import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { FarmersService } from './farmers.service';

@Controller('farmers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  findAll() {
    return this.farmersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  findOne(@Param('id') id: string) {
    return this.farmersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  update(@Param('id') id: string, @Body() dto: UpdateFarmerDto) {
    return this.farmersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  remove(@Param('id') id: string) {
    return this.farmersService.remove(id);
  }

  @Get(':id/sheep')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  findSheepByFarmer(@Param('id') id: string) {
    return this.farmersService.findSheepByFarmer(id);
  }

  @Get(':id/summary')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  summary(@Param('id') id: string) {
    return this.farmersService.summary(id);
  }
}
