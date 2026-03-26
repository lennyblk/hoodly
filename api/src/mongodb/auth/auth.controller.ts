import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto, SigninDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('/signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  logout(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.authService.logout(user.userId);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('/refresh')
  refreshTokens(@Req() req: Request) {
    const user = req.user as { userId: string; email: string; refreshToken: string };
    return this.authService.refreshToken(user.userId, user.email, user.refreshToken);
  }
}
