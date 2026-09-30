import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  SheepGender,
  SheepPhotoAngle,
  SheepStatus,
  UserRole,
} from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSheepDto } from './dto/create-sheep.dto';
import { RecordStatusEventDto } from './dto/record-status-event.dto';
import { UpdateSheepDto } from './dto/update-sheep.dto';
import { SetSheepPhotoDto } from './dto/set-sheep-photo.dto';
import { UpdateSheepPhotoDto } from './dto/update-sheep-photo.dto';
import { UpdateSheepTraitsDto } from './dto/update-sheep-traits.dto';
import { SheepService } from './sheep.service';

@Controller('sheep')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SheepController {
  constructor(private readonly sheepService: SheepService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  create(
    @Body() dto: CreateSheepDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string; role: UserRole },
    @Query('search') search?: string,
    @Query('gender') gender?: SheepGender,
    @Query('status') status?: SheepStatus,
    @Query('breed') breed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sheepService.findAll({
      user,
      search,
      gender,
      status,
      breed,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.findOne(id, user);
  }

  // Foto per sudut dan ciri pembeda: peternak hanya untuk ternaknya sendiri (dicek di service).
  @Get(':id/photos')
  listPhotos(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.listPhotos(id, user);
  }

  @Put(':id/photos/:angle')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  setPhoto(
    @Param('id') id: string,
    @Param('angle', new ParseEnumPipe(SheepPhotoAngle)) angle: SheepPhotoAngle,
    @Body() dto: SetSheepPhotoDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.setPhoto(id, angle, dto, user);
  }

  @Delete(':id/photos/:angle')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  removePhoto(
    @Param('id') id: string,
    @Param('angle', new ParseEnumPipe(SheepPhotoAngle)) angle: SheepPhotoAngle,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.removePhoto(id, angle, user);
  }

  @Patch(':id/traits')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  updateTraits(
    @Param('id') id: string,
    @Body() dto: UpdateSheepTraitsDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.updateTraits(id, dto, user);
  }

  // Foto utama (wajah dan hidung); dipertahankan untuk klien lama.
  @Patch(':id/photo')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  updatePhoto(
    @Param('id') id: string,
    @Body() dto: UpdateSheepPhotoDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.updatePhoto(id, dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSheepDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.sheepService.update(id, dto, user.id);
  }

  @Post(':id/status-event')
  @Roles(UserRole.ADMIN, UserRole.OFFICER, UserRole.FARMER)
  recordStatusEvent(
    @Param('id') id: string,
    @Body() dto: RecordStatusEventDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.sheepService.recordStatusEvent(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OFFICER)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sheepService.remove(id, user.id);
  }
}
