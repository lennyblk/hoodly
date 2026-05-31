import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { IncidentStatus } from '../../../entities/sqlite/Incident';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ example: 'Lampadaire réparé' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Le lampadaire a été remplacé ce matin.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Voirie' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: IncidentStatus, example: IncidentStatus.RESOLVED })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  reportedBy?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsString()
  @IsOptional()
  neighborhoodId?: string;

  @ApiPropertyOptional({ example: '2026-04-04T12:00:00Z' })
  @IsDateString()
  @IsOptional()
  reportedAt?: Date;

  @ApiPropertyOptional({ example: '2026-04-04T12:05:00Z' })
  @IsDateString()
  @IsOptional()
  syncedAt?: Date;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  isDirty?: number;
}
