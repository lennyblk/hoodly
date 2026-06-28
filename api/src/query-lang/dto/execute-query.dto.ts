import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecuteQueryDto {
  @ApiProperty({ example: 'FIND documents WHERE status = "signed" AND type = "contract" LIMIT 10' })
  @IsString()
  @IsNotEmpty()
  query: string;
}
