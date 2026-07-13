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
import { NeighbourhoodsSqliteService } from './neighbourhoods.service';
import { CreateNeighbourhoodSqliteDto } from './dto/create-neighbourhood.dto';
import { UpdateNeighbourhoodSqliteDto } from './dto/update-neighbourhood.dto';

@ApiTags('SQLite Neighbourhoods')
@Controller('sqlite/neighbourhoods')
export class NeighbourhoodsSqliteController {
  constructor(private readonly neighbourhoodsService: NeighbourhoodsSqliteService) {}

  @ApiOperation({ summary: 'Créer un quartier (SQLite)' })
  @ApiResponse({ status: 201, description: 'Quartier créé.' })
  @Post()
  create(@Body() createNeighbourhoodDto: CreateNeighbourhoodSqliteDto) {
    return this.neighbourhoodsService.create(createNeighbourhoodDto);
  }

  @ApiOperation({ summary: 'Lister tous les quartiers (SQLite)' })
  @ApiResponse({ status: 200, description: 'Liste des quartiers.' })
  @Get()
  findAll() {
    return this.neighbourhoodsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un quartier par ID (SQLite)' })
  @ApiParam({ name: 'id', description: 'ID du quartier' })
  @ApiResponse({ status: 200, description: 'Quartier trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neighbourhoodsService.findOne(id);
  }

  @ApiOperation({ summary: 'Modifier un quartier (SQLite)' })
  @ApiParam({ name: 'id', description: 'ID du quartier' })
  @ApiResponse({ status: 200, description: 'Quartier mis à jour.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNeighbourhoodDto: UpdateNeighbourhoodSqliteDto,
  ) {
    return this.neighbourhoodsService.update(id, updateNeighbourhoodDto);
  }

  @ApiOperation({ summary: 'Supprimer un quartier (SQLite)' })
  @ApiParam({ name: 'id', description: 'ID du quartier' })
  @ApiResponse({ status: 200, description: 'Quartier supprimé.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.neighbourhoodsService.remove(id);
  }
}
