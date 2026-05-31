import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Neo4jService } from './neo4j.service';
import { UsersService } from '../mongodb/users/users.service';

@ApiTags('Neo4j')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('neo4j')
export class Neo4jController {
  constructor(
    private neo4jService: Neo4jService,
    private usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Voisin le plus sociable du quartier (Neo4j ATTENDED)' })
  @ApiQuery({ name: 'neighbourhoodId', required: true })
  @ApiResponse({ status: 200 })
  @Get('top-attendee')
  async topAttendee(@Query('neighbourhoodId') neighbourhoodId: string) {
    const top = await this.neo4jService.getTopAttendee(neighbourhoodId);
    if (!top) return null;

    const user = await this.usersService.findOne(top.userId).catch(() => null);
    if (!user) return null;

    return {
      userId: top.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      attendCount: top.attendCount,
    };
  }
}
