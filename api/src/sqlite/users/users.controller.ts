import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UsersSqliteService } from './users.service';
import { CreateUserSqliteDto } from './dto/create-user.dto';
import { UpdateUserSqliteDto } from './dto/update-user.dto';

@ApiTags('SQLite Users')
@Controller('sqlite/users')
export class UsersSqliteController {
  constructor(private readonly usersService: UsersSqliteService) {}

  @ApiOperation({ summary: 'Créer un utilisateur (SQLite)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé.' })
  @Post()
  create(@Body() createUserDto: CreateUserSqliteDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Lister tous les utilisateurs (SQLite)' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs.' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un utilisateur par ID (SQLite)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Modifier un utilisateur (SQLite)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserSqliteDto,
  ) {
    return this.usersService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: 'Supprimer un utilisateur (SQLite)' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
