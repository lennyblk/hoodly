import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateContractDto {
  @ApiProperty({
    description: 'ID de l\'annonce acceptée pour laquelle générer le contrat',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  announcementId: string;
}
