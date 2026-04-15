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
import { BcsService } from './bcs.service';
import { CreateBcsDto } from './dto/create-bcs.dto';
import { UpdateBcsDto } from './dto/update-bcs.dto';

@Controller('bcs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BcsController {
  constructor(private readonly bcsService: BcsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  create(
    @Body() dto: CreateBcsDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.bcsService.create(dto, user);
  }

  @Get('sheep/:sheepId')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findBySheepId(
    @Param('sheepId') sheepId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.bcsService.findBySheepId(sheepId, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  findOne(@Param('id') id: string) {
    return this.bcsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBcsDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.bcsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.bcsService.remove(id, user);
  }
}
