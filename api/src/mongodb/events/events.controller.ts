import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { RsvpDto } from './dto/rsvp.dto';
import { Event } from '../../entities/mongodb/Event';

@ApiTags('Events')
@ApiBearerAuth()
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

  @ApiOperation({ summary: 'Récupérer un événement par ID' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 200, type: Event })
  @ApiResponse({ status: 404, description: 'Événement non trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiOperation({ summary: 'Modifier un événement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 200, type: Event })
  @ApiResponse({ status: 404, description: 'Événement non trouvé.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Supprimer un événement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 200, description: 'Événement supprimé.' })
  @ApiResponse({ status: 404, description: 'Événement non trouvé.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @ApiOperation({ summary: 'Participer à un événement (RSVP)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 201, type: Event })
  @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @Body() dto: RsvpDto) {
    return this.eventsService.rsvp(id, dto.userId);
  }

  @ApiOperation({ summary: 'Marquer un intérêt pour un événement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'événement' })
  @ApiResponse({ status: 201, type: Event })
  @Post(':id/interest')
  interest(@Param('id') id: string, @Body() dto: RsvpDto) {
    return this.eventsService.interest(id, dto.userId);
  }
}
