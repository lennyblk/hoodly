import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../../entities/mongodb/Event';

// La date est volontairement absente : élément essentiel de l'événement,
// elle n'est pas modifiable après création (annuler + recréer si besoin).
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

  @ApiPropertyOptional({ example: '🎉', description: 'Emoji choisi par l\'organisateur (vide = automatique)' })
  @IsString()
  @MaxLength(16)
  @IsOptional()
  emoji?: string;
}
