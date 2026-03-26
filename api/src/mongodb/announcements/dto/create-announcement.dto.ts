import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AnnouncementType,
  AnnouncementStatus,
} from '../../../entities/mongodb/Announcement';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  neighbourhoodId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(AnnouncementType)
  @IsNotEmpty()
  type: AnnouncementType;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsEnum(AnnouncementStatus)
  @IsOptional()
  status?: AnnouncementStatus;
}
