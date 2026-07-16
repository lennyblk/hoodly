import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Neo4jService } from './neo4j.service';

@ApiTags('Neo4j')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('neo4j')
export class Neo4jController {
  constructor(private neo4jService: Neo4jService) {}
}
