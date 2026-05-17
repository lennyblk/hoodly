import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { Incident } from '../../entities/sqlite/Incident';

@ApiTags('Incidents')
@ApiBearerAuth()
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @ApiOperation({ summary: 'Signaler un incident' })
  @ApiResponse({ status: 201, type: Incident })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @Post()
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @ApiOperation({ summary: 'Récupérer tous les incidents' })
  @ApiResponse({ status: 200, type: [Incident] })
  @Get()
  findAll() {
    return this.incidentsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un incident par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l\'incident' })
  @ApiResponse({ status: 200, type: Incident })
  @ApiResponse({ status: 404, description: 'Incident non trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Mettre à jour un incident (statut, sync)' })
  @ApiParam({ name: 'id', description: 'UUID de l\'incident' })
  @ApiResponse({ status: 200, type: Incident })
  @ApiResponse({ status: 404, description: 'Incident non trouvé.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @ApiOperation({ summary: 'Supprimer un incident' })
  @ApiParam({ name: 'id', description: 'UUID de l\'incident' })
  @ApiResponse({ status: 200, description: 'Incident supprimé.' })
  @ApiResponse({ status: 404, description: 'Incident non trouvé.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}
