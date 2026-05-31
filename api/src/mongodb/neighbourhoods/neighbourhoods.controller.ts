import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NeighbourhoodsService } from './neighbourhoods.service';
import { CreateNeighbourhoodDto } from './dto/create-neighbourhood.dto';
import { UpdateNeighbourhoodDto } from './dto/update-neighbourhood.dto';
import { Neighbourhood } from '../../entities/mongodb/Neighbourhood';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Neighbourhoods')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('neighbourhoods')
export class NeighbourhoodsController {
  constructor(private readonly neighbourhoodsService: NeighbourhoodsService) {}

  @ApiOperation({ summary: 'Créer un quartier — admin uniquement' })
  @ApiResponse({ status: 201, type: Neighbourhood })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
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
  @ApiResponse({ status: 400, description: 'ID invalide.' })
  @ApiResponse({ status: 404, description: 'Quartier non trouvé.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neighbourhoodsService.findOne(id);
  }

  @ApiOperation({ summary: 'Mettre à jour un quartier — admin ou modérateur (son propre quartier)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du quartier' })
  @ApiResponse({ status: 200, type: Neighbourhood })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Quartier non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATEUR, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNeighbourhoodDto: UpdateNeighbourhoodDto, @Req() req: Request) {
    const reqUser = (req as any).user as { role: string; neighbourhoodId?: string };
    if (reqUser.role === UserRole.MODERATEUR && reqUser.neighbourhoodId !== id) {
      throw new ForbiddenException('Un modérateur ne peut modifier que son propre quartier');
    }
    return this.neighbourhoodsService.update(id, updateNeighbourhoodDto);
  }

  @ApiOperation({ summary: 'Supprimer un quartier — admin uniquement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB du quartier' })
  @ApiResponse({ status: 200, description: 'Quartier supprimé.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Quartier non trouvé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.neighbourhoodsService.remove(id);
  }
}
