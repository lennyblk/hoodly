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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
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

  @ApiOperation({ summary: 'Créer une annonce — modérateur ou admin' })
  @ApiResponse({ status: 201, type: Announcement })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATEUR, UserRole.ADMIN)
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
