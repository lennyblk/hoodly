import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../../entities/mongodb/User';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignupDto, SigninDto } from './dto';
import { Tokens } from './types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Créer un compte' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: 'Compte créé, tokens retournés.' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé.' })
  @Post('/signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: 'Se connecter' })
  @ApiBody({ type: SigninDto })
  @ApiResponse({ status: 201, description: 'Connexion réussie, tokens retournés.' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides.' })
  @Post('/signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @ApiOperation({ summary: 'Récupérer le profil connecté' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 401, description: 'Non authentifié.' })
  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  me(@Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.usersService.findOne(user.userId);
  }

  @ApiOperation({ summary: 'Se déconnecter (révoque le refresh token)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Déconnexion réussie.' })
  @ApiResponse({ status: 401, description: 'Non authentifié.' })
  @UseGuards(AuthGuard('jwt'))
  @Post('/logout')
  logout(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.authService.logout(user.userId);
  }

  @ApiOperation({ summary: 'Rafraîchir les tokens (Bearer = refresh token)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Nouveaux tokens retournés.' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide ou expiré.' })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('/refresh')
  refreshTokens(@Req() req: Request) {
    const user = req.user as { userId: string; email: string; refreshToken: string };
    return this.authService.refreshToken(user.userId, user.email, user.refreshToken);
  }
}
