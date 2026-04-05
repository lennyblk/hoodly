import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { IncidentStatus } from '../../../entities/sqlite/Incident';

export class CreateIncidentDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID généré localement' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Lampadaire cassé' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Le lampadaire au bout de la rue ne fonctionne plus depuis 3 jours.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Voirie' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ enum: IncidentStatus, default: IncidentStatus.OPEN })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'ID de l\'utilisateur qui signale (MongoDB)' })
  @IsString()
  @IsNotEmpty()
  reportedBy: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'ID du quartier (MongoDB)' })
  @IsString()
  @IsNotEmpty()
  neighborhoodId: string;

  @ApiPropertyOptional({ example: '2026-04-04T12:00:00Z' })
  @IsDateString()
  @IsOptional()
  reportedAt?: Date;

  @ApiPropertyOptional({ example: '2026-04-04T12:05:00Z' })
  @IsDateString()
  @IsOptional()
  syncedAt?: Date;

  @ApiPropertyOptional({ example: 0, description: '1 si créé hors ligne et non synchronisé, 0 sinon' })
  @IsNumber()
  @IsOptional()
  isDirty?: number;
}