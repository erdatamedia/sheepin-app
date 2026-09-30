import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginFarmerDto } from './dto/login-farmer.dto';
import { RegisterFarmerDto } from './dto/register-farmer.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Batas per IP: menyulitkan tebak-tebakan kata sandi dan ID peternak.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login-farmer')
  loginFarmer(@Body() dto: LoginFarmerDto) {
    return this.authService.loginFarmer(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @Post('register-farmer')
  registerFarmer(@Body() dto: RegisterFarmerDto) {
    return this.authService.registerFarmer(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }
}
