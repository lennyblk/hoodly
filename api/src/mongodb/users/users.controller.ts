import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
  Query,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PointsService } from './points.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { User } from '../../entities/mongodb/User';
import { PointsTransaction } from '../../entities/mongodb/PointsTransaction';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private pointsService: PointsService,
    private jwtService: JwtService,
  ) { }

  @ApiOperation({ summary: 'Récupérer tous les utilisateurs — admin uniquement' })
  @ApiResponse({ status: 200, type: [User] })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Compter les utilisateurs d\'un quartier' })
  @ApiQuery({ name: 'neighbourhoodId', required: true })
  @ApiResponse({ status: 200, schema: { properties: { count: { type: 'number' } } } })
  @Get('count')
  countByNeighbourhood(@Query('neighbourhoodId') neighbourhoodId: string) {
    return this.usersService.countByNeighbourhood(neighbourhoodId).then((count) => ({ count }));
  }

  @ApiOperation({ summary: 'Lister les utilisateurs d\'un quartier' })
  @ApiQuery({ name: 'neighbourhoodId', required: true })
  @ApiResponse({ status: 200, type: [User] })
  @Get('neighbourhood')
  findByNeighbourhood(@Query('neighbourhoodId') neighbourhoodId: string) {
    return this.usersService.findByNeighbourhood(neighbourhoodId);
  }

  @ApiOperation({ summary: 'Lister les administrateurs — accessible à tout utilisateur connecté (contact support)' })
  @ApiResponse({ status: 200, type: [User] })
  @Get('admins')
  findAdmins() {
    return this.usersService.findAdmins();
  }

  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'utilisateur' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 400, description: 'ID invalide.' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Créer un utilisateur — admin uniquement' })
  @ApiResponse({ status: 201, type: User })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Nombre de voisins dans un quartier' })
  @ApiQuery({ name: 'neighbourhoodId', required: true })
  @ApiResponse({ status: 200 })
  @Get('count')
  count(@Query('neighbourhoodId') neighbourhoodId: string) {
    return this.usersService.countByNeighbourhood(neighbourhoodId).then((n) => ({ count: n }));
  }

  @ApiOperation({ summary: 'Exporter toutes ses données personnelles (RGPD)' })
  @ApiResponse({ status: 200, description: 'Données exportées en JSON.' })
  @Get('me/export')
  exportMyData(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.usersService.exportData(user.userId);
  }

  @ApiOperation({ summary: 'Historique des mouvements de points de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, type: [PointsTransaction] })
  @Get('me/points/history')
  getMyPointsHistory(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.pointsService.getHistory(user.userId);
  }

  @ApiOperation({ summary: 'Supprimer son compte et toutes ses données (RGPD)' })
  @ApiResponse({ status: 200, description: 'Compte supprimé.' })
  @Delete('me')
  deleteMyAccount(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.usersService.deleteAccount(user.userId);
  }

  @ApiOperation({ summary: 'Modifier son propre profil (firstName, lastName, email, password, address, neighbourhoodId). Email/password/address nécessitent un otpToken valide.' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 400, description: 'OTP token manquant ou données invalides.' })
  @ApiResponse({ status: 401, description: 'OTP token expiré ou invalide.' })
  @Patch('me')
  async updateMe(@Req() req: Request, @Body() dto: UpdateMeDto) {
    const user = req.user as { userId: string; email: string };
    const currentUser = await this.usersService.findOne(user.userId);

    const emailChanged = dto.email !== undefined && dto.email !== currentUser.email;
    const addressChanged = dto.address !== undefined && dto.address !== currentUser.address;

    if (emailChanged || dto.password || addressChanged) {
      if (!dto.otpToken) {
        throw new BadRequestException('Un code OTP est requis pour modifier l\'email, le mot de passe ou l\'adresse');
      }
      try {
        const payload = await this.jwtService.verifyAsync<{ email: string; type: string }>(
          dto.otpToken,
          { secret: process.env.OTP_SECRET },
        );
        if (payload.type !== 'otp' || payload.email !== user.email) {
          throw new UnauthorizedException('OTP token invalide ou ne correspond pas à cet utilisateur');
        }
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        throw new UnauthorizedException('OTP token expiré ou invalide');
      }
    }

    const { otpToken: _, ...updateData } = dto;
    return this.usersService.update(user.userId, updateData);
  }

  @ApiOperation({ summary: 'Ajuster le solde de points d\'un utilisateur — admin uniquement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Points ajustés.' })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/points')
  adjustPoints(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: { amount: number; reason: string },
  ) {
    const admin = req.user as { userId: string; email: string };
    return this.pointsService.addPoints(
      id,
      body.amount,
      `[Admin ${admin.email}] ${body.reason}`,
    );
  }

  @ApiOperation({ summary: 'Mettre à jour un utilisateur — admin uniquement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'utilisateur' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 400, description: 'ID invalide.' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Supprimer un utilisateur — admin uniquement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé.' })
  @ApiResponse({ status: 400, description: 'ID invalide.' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
