import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../../../entities/mongodb/Message';

export class CreateMessageDto {
  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e1' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ example: '64a1f2c3e4b5f6a7b8c9d0e2' })
  @IsString()
  @IsNotEmpty()
  senderId: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiProperty({ example: 'Bonjour tout le monde !' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
