import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NeighbourhoodsSqliteService } from './neighbourhoods.service';
import { CreateNeighbourhoodSqliteDto } from './dto/create-neighbourhood.dto';
import { UpdateNeighbourhoodSqliteDto } from './dto/update-neighbourhood.dto';

@Controller('sqlite/neighbourhoods')
export class NeighbourhoodsSqliteController {
  constructor(private readonly neighbourhoodsService: NeighbourhoodsSqliteService) {}

  @Post()
  create(@Body() createNeighbourhoodDto: CreateNeighbourhoodSqliteDto) {
    return this.neighbourhoodsService.create(createNeighbourhoodDto);
  }

  @Get()
  findAll() {
    return this.neighbourhoodsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neighbourhoodsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNeighbourhoodDto: UpdateNeighbourhoodSqliteDto,
  ) {
    return this.neighbourhoodsService.update(id, updateNeighbourhoodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.neighbourhoodsService.remove(id);
  }
}