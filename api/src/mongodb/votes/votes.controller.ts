import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { Vote } from '../../entities/mongodb/Vote';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Votes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @ApiOperation({ summary: 'Créer un sondage — modérateur ou admin' })
  @ApiResponse({ status: 201, type: Vote })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATEUR, UserRole.ADMIN)
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

  @ApiOperation({ summary: 'Supprimer un sondage — modérateur ou admin' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du sondage' })
  @ApiResponse({ status: 200, description: 'Sondage supprimé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Sondage non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATEUR, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.votesService.remove(id);
  }
}
