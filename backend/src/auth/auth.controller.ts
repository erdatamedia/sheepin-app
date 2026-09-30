import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { AllowPendingPin } from './decorators/allow-pending-pin.decorator';
import { ChangePinDto } from './dto/change-pin.dto';
import { LoginDto } from './dto/login.dto';
import { LoginPhoneDto } from './dto/login-phone.dto';
import { LoginFarmerDto } from './dto/login-farmer.dto';
import { RegisterFarmerDto } from './dto/register-farmer.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Batas per IP: menyulitkan tebak-tebakan kata sandi, PIN, dan ID peternak.
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

  // Login peternak: no. HP + PIN (akun terkunci 15 menit setelah 5 kali salah).
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login-phone')
  loginPhone(@Body() dto: LoginPhoneDto) {
    return this.authService.loginPhone(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @Post('register-farmer')
  registerFarmer(@Body() dto: RegisterFarmerDto) {
    return this.authService.registerFarmer(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @AllowPendingPin()
  me(@CurrentUser() user: { id: string; mustChangePin?: boolean }) {
    return this.authService.me(user.id, user.mustChangePin);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('change-pin')
  @UseGuards(JwtAuthGuard)
  @AllowPendingPin()
  changePin(@CurrentUser() user: { id: string }, @Body() dto: ChangePinDto) {
    return this.authService.changePin(user.id, dto);
  }
}
