import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceDetails } from '../../../entities/mongodb/Announcement';

export class AcceptAnnouncementDto {
  @ApiPropertyOptional({ type: ServiceDetails })
  @IsObject()
  @IsOptional()
  serviceDetails?: ServiceDetails;
}
