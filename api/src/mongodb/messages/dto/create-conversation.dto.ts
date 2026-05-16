import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ example: ['64a1f2c3e4b5f6a7b8c9d0e1', '64a1f2c3e4b5f6a7b8c9d0e2'], type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  participants: string[];
}
