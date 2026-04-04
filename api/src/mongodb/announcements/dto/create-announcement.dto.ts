import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AnnouncementType,
  AnnouncementStatus,
} from '../../../entities/mongodb/Announcement';

export class CreateAnnouncementDto {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1' })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @IsString()
  @IsNotEmpty()
  neighbourhoodId: string;

  @ApiProperty({ example: 'Tonte de pelouse' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Je propose de tondre la pelouse de mes voisins.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: AnnouncementType, example: AnnouncementType.OFFER })
  @IsEnum(AnnouncementType)
  @IsNotEmpty()
  type: AnnouncementType;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsNumber()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ enum: AnnouncementStatus, default: AnnouncementStatus.OPEN })
  @IsEnum(AnnouncementStatus)
  @IsOptional()
  status?: AnnouncementStatus;
}
