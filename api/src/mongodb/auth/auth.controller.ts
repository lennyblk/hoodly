import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../../entities/mongodb/User';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignupDto, SigninDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('/signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('/signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @ApiOperation({ summary: 'Récupérer le profil connecté' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 401, description: 'Non authentifié.' })
  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  me(@Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.usersService.findOne(user.userId);
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
