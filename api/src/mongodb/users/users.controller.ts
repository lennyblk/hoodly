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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { User } from '../../entities/mongodb/User';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

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

  @ApiOperation({ summary: 'Modifier son propre profil (firstName, lastName, email, password, lang, neighbourhoodId)' })
  @ApiResponse({ status: 200, type: User })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @Patch('me')
  updateMe(@Req() req: Request, @Body() dto: UpdateMeDto) {
    const user = req.user as { userId: string };
    return this.usersService.update(user.userId, dto);
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
