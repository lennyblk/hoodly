import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersSqliteService } from './users.service';
import { CreateUserSqliteDto } from './dto/create-user.dto';
import { UpdateUserSqliteDto } from './dto/update-user.dto';

@Controller('sqlite/users')
export class UsersSqliteController {
  constructor(private readonly usersService: UsersSqliteService) {}

  @Post()
  create(@Body() createUserDto: CreateUserSqliteDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserSqliteDto,
  ) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}