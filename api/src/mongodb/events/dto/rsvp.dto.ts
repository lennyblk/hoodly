import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RsvpDto {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
