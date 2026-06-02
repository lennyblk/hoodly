import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SigninDto {
  @ApiProperty({ example: "admin@hoodly.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Admin1234!" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
