import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { Incident } from '../../entities/sqlite/Incident';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../../mongodb/auth/types/jwt-payload.type';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
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

  @ApiOperation({ summary: 'Récupérer tous les incidents (filtrés par quartier pour modérateur)' })
  @ApiResponse({ status: 200, type: [Incident] })
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as JwtPayload;
    if (user.role === UserRole.MODERATEUR) {
      if (!user.neighbourhoodId) return [];
      return this.incidentsService.findByNeighbourhood(user.neighbourhoodId);
    }
    return this.incidentsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un incident par ID' })
  @ApiParam({ name: 'id', description: 'UUID de l\'incident' })
  @ApiResponse({ status: 200, type: Incident })
  @ApiResponse({ status: 403, description: 'Accès refusé (quartier différent).' })
  @ApiResponse({ status: 404, description: 'Incident non trouvé.' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const incident = await this.incidentsService.findOne(id);
    const user = req.user as JwtPayload;
    if (user.role === UserRole.MODERATEUR && incident.neighborhoodId !== user.neighbourhoodId) {
      throw new ForbiddenException('Accès limité à votre quartier');
    }
    return incident;
  }

  @ApiOperation({ summary: 'Mettre à jour un incident — modérateur (son quartier) ou admin' })
  @ApiParam({ name: 'id', description: 'UUID de l\'incident' })
  @ApiResponse({ status: 200, type: Incident })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Incident non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATEUR, UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto, @Req() req: Request) {
    const user = req.user as JwtPayload;
    if (user.role === UserRole.MODERATEUR) {
      const incident = await this.incidentsService.findOne(id);
      if (incident.neighborhoodId !== user.neighbourhoodId) {
        throw new ForbiddenException('Accès limité à votre quartier');
      }
    }
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @ApiOperation({ summary: 'Supprimer un incident — admin uniquement' })
  @ApiParam({ name: 'id', description: 'UUID de l\'incident' })
  @ApiResponse({ status: 200, description: 'Incident supprimé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Incident non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentsService.remove(id);
  }
}
