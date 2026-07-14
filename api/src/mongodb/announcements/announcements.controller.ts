import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AcceptAnnouncementDto } from './dto/accept-announcement.dto';
import { Announcement } from '../../entities/mongodb/Announcement';

import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/mongodb/User';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @ApiOperation({ summary: 'Créer une annonce' })
  @ApiResponse({ status: 201, type: Announcement })
  @Post()
  create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.announcementsService.create(createAnnouncementDto);
  }

  @ApiOperation({ summary: 'Récupérer toutes les annonces' })
  @ApiQuery({ name: 'neighbourhoodId', required: false, description: 'Filtrer par quartier' })
  @ApiResponse({ status: 200, type: [Announcement] })
  @Get()
  findAll(@Query('neighbourhoodId') neighbourhoodId?: string) {
    return this.announcementsService.findAll(neighbourhoodId);
  }

  @ApiOperation({ summary: 'Récupérer une annonce par ID' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @ApiResponse({ status: 400, description: 'ID invalide.' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @ApiOperation({ summary: 'Accepter une annonce — tout utilisateur authentifié (sauf l\'auteur)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @ApiResponse({ status: 400, description: 'Déjà acceptée ou auteur ne peut pas accepter.' })
  @Post(':id/accept')
  accept(@Param('id') id: string, @Req() req: Request, @Body() dto: AcceptAnnouncementDto) {
    const user = (req as any).user as { userId: string };
    return this.announcementsService.accept(id, user.userId, dto?.serviceDetails);
  }

  @ApiOperation({ summary: 'Modifier son annonce (auteur, tant que non acceptée)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @Patch(':id/mine')
  updateMine(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateAnnouncementDto) {
    const user = (req as any).user as { userId: string };
    return this.announcementsService.updateByAuthor(id, user.userId, dto);
  }

  @ApiOperation({ summary: 'Supprimer son annonce (auteur, tant que non acceptée)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Annonce supprimée.' })
  @Delete(':id/mine')
  removeMine(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.announcementsService.removeByAuthor(id, user.userId);
  }

  @ApiOperation({ summary: 'Annuler une annonce (auteur ou accepteur, min 24h avant prestation)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.announcementsService.cancel(id, user.userId);
  }

  @ApiOperation({ summary: 'Se désister d\'une annonce acceptée (min 24h avant prestation)' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user as { userId: string };
    return this.announcementsService.withdraw(id, user.userId);
  }

  @ApiOperation({ summary: 'Mettre à jour une annonce — modérateur ou admin' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATEUR, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnnouncementDto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @ApiOperation({ summary: 'Supprimer une annonce — admin uniquement' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Annonce supprimée.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
