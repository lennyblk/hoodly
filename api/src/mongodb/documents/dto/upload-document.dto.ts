import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '../../../entities/mongodb/Document';

export class UploadDocumentDto {
  @ApiProperty({ example: 'Contrat de service - Jardinage' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ enum: DocumentType, default: DocumentType.OTHER })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsOptional()
  announcementId?: string;

  @ApiProperty({ example: 'voisin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  signerEmail: string;
}
