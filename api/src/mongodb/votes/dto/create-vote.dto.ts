import { IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoteType } from '../../../entities/mongodb/Vote';

export class CreateVoteDto {
  @ApiProperty({ example: 'Faut-il installer des bancs dans le parc ?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ enum: VoteType, default: VoteType.YESNO })
  @IsEnum(VoteType)
  @IsOptional()
  type?: VoteType;

  @ApiProperty({ example: ['Pour', 'Contre'], type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[];

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endsAt: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @IsString()
  @IsNotEmpty()
  neighbourhoodId: string;
}
