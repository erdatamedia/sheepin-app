import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateFarmerDto } from './dto/create-farmer.dto';
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

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @Header('Cache-Control', 'no-store')
  create(@Body() dto: CreateFarmerDto, @CurrentUser() actor: { id: string }) {
    return this.farmersService.create(dto, actor.id);
  }

  @Post(':id/reset-pin')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  @Header('Cache-Control', 'no-store')
  resetPin(@Param('id') id: string, @CurrentUser() actor: { id: string }) {
    return this.farmersService.resetPin(id, actor.id);
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
