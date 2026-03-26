import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  AnnouncementType,
  AnnouncementStatus,
} from '../../../entities/mongodb/Announcement';

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  authorId?: string;

  @IsString()
  @IsOptional()
  neighbourhoodId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsEnum(AnnouncementStatus)
  @IsOptional()
  status?: AnnouncementStatus;

  @IsString()
  @IsOptional()
  acceptedBy?: string;

  @IsString()
  @IsOptional()
  contractId?: string;
}
