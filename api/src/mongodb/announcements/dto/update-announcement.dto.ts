import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AnnouncementType,
  AnnouncementStatus,
} from '../../../entities/mongodb/Announcement';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e1' })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @IsString()
  @IsOptional()
  neighbourhoodId?: string;

  @ApiPropertyOptional({ example: 'Tonte de pelouse' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Je propose de tondre la pelouse de mes voisins.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: AnnouncementType })
  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ enum: AnnouncementStatus })
  @IsEnum(AnnouncementStatus)
  @IsOptional()
  status?: AnnouncementStatus;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e3' })
  @IsString()
  @IsOptional()
  acceptedBy?: string;

  @ApiPropertyOptional({ example: '64a1f2c3e4b5f6a7b8c9d0e4' })
  @IsString()
  @IsOptional()
  contractId?: string;
}
