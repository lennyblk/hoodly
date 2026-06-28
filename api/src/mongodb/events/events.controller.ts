import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RsvpDto } from './dto/rsvp.dto';
import { Event } from '../../entities/mongodb/Event';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Créer un événement' })
  @ApiResponse({ status: 201, type: Event })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @ApiOperation({ summary: 'Lister les événements' })
  @ApiQuery({ name: 'neighbourhoodId', required: false, description: 'Filtrer par quartier' })
  @ApiResponse({ status: 200, type: [Event] })
  @Get()
  findAll(@Query('neighbourhoodId') neighbourhoodId?: string) {
    return this.eventsService.findAll(neighbourhoodId);
  }

  @ApiOperation({ summary: 'Événements recommandés via Neo4j (INTERESTED_IN + ATTENDED)' })
  @ApiQuery({ name: 'userId', required: true, description: 'ID de l\'utilisateur' })
  @ApiQuery({ name: 'neighbourhoodId', required: true, description: 'ID du quartier' })
  @ApiResponse({ status: 200, type: [Event] })
  @Get('recommendations')
  async recommendations(
    @Query('userId') userId: string,
    @Query('neighbourhoodId') neighbourhoodId: string,
  ) {
    const ids = await this.eventsService.getRecommendations(userId, neighbourhoodId);
    if (!ids.length) return [];
    return Promise.all(ids.map((id) => this.eventsService.findOne(id).catch(() => null)))
      .then((events) => events.filter(Boolean));
  }

  @ApiOperation({ summary: 'Récupérer un événement par ID' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 200, type: Event })
  @ApiResponse({ status: 404, description: 'Événement non trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiOperation({ summary: 'Modifier un événement — modérateur ou admin' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 200, type: Event })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Événement non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATEUR, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Supprimer un événement — admin uniquement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 200, description: 'Événement supprimé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Événement non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @ApiOperation({ summary: 'Participer / se désinscrire d\'un événement (toggle)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 201, type: Event })
  @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @Body() dto: RsvpDto) {
    return this.eventsService.rsvp(id, dto.userId);
  }

  @ApiOperation({ summary: 'Marquer / retirer un intérêt pour un événement (toggle) — alimente INTERESTED_IN Neo4j' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 201, type: Event })
  @Post(':id/interest')
  interest(@Param('id') id: string, @Body() dto: RsvpDto) {
    return this.eventsService.interest(id, dto.userId);
  }
}
