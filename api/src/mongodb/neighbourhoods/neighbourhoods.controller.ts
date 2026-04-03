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
import { NeighbourhoodsService } from './neighbourhoods.service';
import { CreateNeighbourhoodDto } from './dto/create-neighbourhood.dto';
import { UpdateNeighbourhoodDto } from './dto/update-neighbourhood.dto';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';

@ApiTags('Neighbourhoods')
@Controller('neighbourhoods')
export class NeighbourhoodsController {
  constructor(private readonly neighbourhoodsService: NeighbourhoodsService) {}

  @ApiOperation({ summary: 'Créer un quartier' })
  @ApiResponse({ status: 201, type: Neighbourhood })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @Post()
  create(@Body() createNeighbourhoodDto: CreateNeighbourhoodDto) {
    return this.neighbourhoodsService.create(createNeighbourhoodDto);
  }

  @ApiOperation({ summary: 'Récupérer tous les quartiers' })
  @ApiResponse({ status: 200, type: [Neighbourhood] })
  @Get()
  findAll() {
    return this.neighbourhoodsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un quartier par ID' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du quartier' })
  @ApiResponse({ status: 200, type: Neighbourhood })
  @ApiResponse({ status: 404, description: 'Quartier non trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neighbourhoodsService.findOne(id);
  }

  @ApiOperation({ summary: 'Mettre à jour un quartier' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du quartier' })
  @ApiResponse({ status: 200, type: Neighbourhood })
  @ApiResponse({ status: 404, description: 'Quartier non trouvé.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNeighbourhoodDto: UpdateNeighbourhoodDto,
  ) {
    return this.neighbourhoodsService.update(id, updateNeighbourhoodDto);
  }

  @ApiOperation({ summary: 'Supprimer un quartier' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du quartier' })
  @ApiResponse({ status: 200, description: 'Quartier supprimé.' })
  @ApiResponse({ status: 404, description: 'Quartier non trouvé.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.neighbourhoodsService.remove(id);
  }
}
