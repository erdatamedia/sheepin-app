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
import { CreateReproductionDto } from './dto/create-reproduction.dto';
import { UpdateReproductionDto } from './dto/update-reproduction.dto';
import { ReproductionService } from './reproduction.service';

@Controller('reproduction')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReproductionController {
  constructor(private readonly reproductionService: ReproductionService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  create(
    @Body() dto: CreateReproductionDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reproductionService.create(dto, user);
  }

  @Get('sheep/:sheepId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findBySheepId(
    @Param('sheepId') sheepId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reproductionService.findBySheepId(sheepId, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findOne(@Param('id') id: string) {
    return this.reproductionService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReproductionDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reproductionService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reproductionService.remove(id, user);
  }
}
