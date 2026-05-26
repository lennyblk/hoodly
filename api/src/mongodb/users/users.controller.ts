import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../entities/mongodb/User';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Récupérer tous les utilisateurs — admin uniquement' })
  @ApiResponse({ status: 200, type: [User] })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
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
