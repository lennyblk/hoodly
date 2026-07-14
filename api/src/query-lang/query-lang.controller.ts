import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueryLangService } from './query-lang.service';
import { ExecuteQueryDto } from './dto/execute-query.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/mongodb/User';

@ApiTags('Query Language (HQL)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('query-lang')
export class QueryLangController {
  constructor(private readonly queryLangService: QueryLangService) {}

  @ApiOperation({
    summary: 'Exécute une requête HQL (Hoodly Query Language) — admin uniquement',
    description:
      'Syntaxe : FIND documents [WHERE <condition>] [LIMIT <n>]. ' +
      'Le langage ne cible que la collection documents ; champs interrogeables : ' +
      'id, title, type, name, ownerId, signers, status, gridfsId, announcementId, createdAt.',
  })
  @ApiResponse({ status: 201, description: 'Résultat de la requête (filtre Mongo traduit + documents).' })
  @ApiResponse({ status: 400, description: 'Erreur de syntaxe HQL.' })
  @ApiResponse({ status: 403, description: 'Accès refusé.' })
  @Post('execute')
  execute(@Body() dto: ExecuteQueryDto) {
    return this.queryLangService.execute(dto.query);
  }
}
