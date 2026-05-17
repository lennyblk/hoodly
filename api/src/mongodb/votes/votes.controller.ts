import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { Vote } from '../../entities/mongodb/Vote';

@ApiTags('Votes')
@ApiBearerAuth()
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @ApiOperation({ summary: 'Créer un sondage' })
  @ApiResponse({ status: 201, type: Vote })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @Post()
  create(@Body() dto: CreateVoteDto) {
    return this.votesService.create(dto);
  }

  @ApiOperation({ summary: 'Lister les sondages' })
  @ApiQuery({ name: 'neighbourhoodId', required: false, description: 'Filtrer par quartier' })
  @ApiResponse({ status: 200, type: [Vote] })
  @Get()
  findAll(@Query('neighbourhoodId') neighbourhoodId?: string) {
    return this.votesService.findAll(neighbourhoodId);
  }

  @ApiOperation({ summary: 'Récupérer un sondage avec ses résultats' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du sondage' })
  @ApiResponse({ status: 200, type: Vote })
  @ApiResponse({ status: 404, description: 'Sondage non trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.votesService.getResults(id);
  }

  @ApiOperation({ summary: 'Voter pour une option' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du sondage' })
  @ApiResponse({ status: 201, type: Vote })
  @ApiResponse({ status: 400, description: 'Option invalide.' })
  @ApiResponse({ status: 403, description: 'Vote expiré ou déjà voté.' })
  @Post(':id/cast')
  cast(@Param('id') id: string, @Body() dto: CastVoteDto) {
    return this.votesService.cast(id, dto);
  }

  @ApiOperation({ summary: 'Supprimer un sondage' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du sondage' })
  @ApiResponse({ status: 200, description: 'Sondage supprimé.' })
  @ApiResponse({ status: 404, description: 'Sondage non trouvé.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.votesService.remove(id);
  }
}
