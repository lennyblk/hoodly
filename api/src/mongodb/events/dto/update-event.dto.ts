import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../../entities/mongodb/Event';

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Soirée de quartier modifiée' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Description mise à jour.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional({ example: '2026-06-20T18:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  date?: string;
}
