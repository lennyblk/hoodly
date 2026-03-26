import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NeighbourhoodsService } from './neighbourhoods.service';
import { CreateNeighbourhoodDto } from './dto/create-neighbourhood.dto';
import { UpdateNeighbourhoodDto } from './dto/update-neighbourhood.dto';

@Controller('neighbourhoods')
export class NeighbourhoodsController {
  constructor(private readonly neighbourhoodsService: NeighbourhoodsService) {}

  @Post()
  create(@Body() createNeighbourhoodDto: CreateNeighbourhoodDto) {
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
    @Body() updateNeighbourhoodDto: UpdateNeighbourhoodDto,
  ) {
    return this.neighbourhoodsService.update(id, updateNeighbourhoodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.neighbourhoodsService.remove(id);
  }
}
