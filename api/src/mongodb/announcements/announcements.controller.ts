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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Announcement } from '../../entities/mongodb/Announcement';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @ApiOperation({ summary: 'Créer une annonce' })
  @ApiResponse({ status: 201, type: Announcement })
  @ApiResponse({ status: 400, description: 'Données invalides.' })
  @Post()
  create(@Body() createAnnouncementDto: CreateAnnouncementDto) {
    return this.announcementsService.create(createAnnouncementDto);
  }

  @ApiOperation({ summary: 'Récupérer toutes les annonces' })
  @ApiResponse({ status: 200, type: [Announcement] })
  @Get()
  findAll() {
    return this.announcementsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer une annonce par ID' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @ApiOperation({ summary: 'Mettre à jour une annonce' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, type: Announcement })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  @ApiOperation({ summary: 'Supprimer une annonce' })
  @ApiParam({ name: 'id', description: 'ObjectId MongoDB de l\'annonce' })
  @ApiResponse({ status: 200, description: 'Annonce supprimée.' })
  @ApiResponse({ status: 404, description: 'Annonce non trouvée.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
