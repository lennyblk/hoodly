import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({ example: 'john.doe@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MonMotDePasse1!' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;
}
