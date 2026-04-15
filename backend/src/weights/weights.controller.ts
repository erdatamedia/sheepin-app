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
import { CreateWeightDto } from './dto/create-weight.dto';
import { UpdateWeightDto } from './dto/update-weight.dto';
import { WeightsService } from './weights.service';

@Controller('weights')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WeightsController {
  constructor(private readonly weightsService: WeightsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  create(
    @Body() dto: CreateWeightDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.weightsService.create(dto, user);
  }

  @Get('sheep/:sheepId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findBySheepId(
    @Param('sheepId') sheepId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.weightsService.findBySheepId(sheepId, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findOne(@Param('id') id: string) {
    return this.weightsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWeightDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.weightsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.weightsService.remove(id, user);
  }
}
