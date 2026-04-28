import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { SaveGameService } from './save-game.service';
import { SaveGame } from './save-game.entity';

@Controller('save-games')
export class SaveGameController {
  constructor(private readonly svc: SaveGameService) {}

  @Get()
  findAll(): SaveGame[] {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): SaveGame {
    return this.svc.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: Partial<SaveGame>): SaveGame {
    return this.svc.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
