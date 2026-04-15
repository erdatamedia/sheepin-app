import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginFarmerDto } from './dto/login-farmer.dto';
import { RegisterFarmerDto } from './dto/register-farmer.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('login-farmer')
  loginFarmer(@Body() dto: LoginFarmerDto) {
    return this.authService.loginFarmer(dto);
  }

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
