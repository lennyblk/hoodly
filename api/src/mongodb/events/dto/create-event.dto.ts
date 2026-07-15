import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../../entities/mongodb/Event';

export class CreateEventDto {
  @ApiProperty({ example: 'Soirée de quartier' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Une soirée conviviale pour les habitants du quartier.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: EventType, default: EventType.OTHER })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @IsString()
  @IsNotEmpty()
  organizerId: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e3' })
  @IsString()
  @IsNotEmpty()
  neighbourhoodId: string;

  @ApiProperty({ example: '2026-06-15T18:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ example: '🎉', description: 'Emoji choisi par l\'organisateur' })
  @IsString()
  @MaxLength(16)
  @IsOptional()
  emoji?: string;
}
