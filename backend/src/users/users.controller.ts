import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateMyLocationDto } from './dto/update-my-location.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/sheep')
  getMySheep(@CurrentUser() user: { id: string; role: UserRole }) {
    return this.usersService.getMySheep(user);
  }

  @Get('me/location')
  getMyLocation(@CurrentUser() user: { id: string }) {
    return this.usersService.getMyLocation(user.id);
  }

  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(user.id, dto);
  }

  @Patch('me/location')
  updateMyLocation(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateMyLocationDto,
  ) {
    return this.usersService.updateMyLocation(user.id, dto);
  }
}
