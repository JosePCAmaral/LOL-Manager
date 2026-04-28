import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PlayerService } from './player.service';
import { Player } from './player.entity';

@Controller('players')
export class PlayerController {
  constructor(private readonly svc: PlayerService) {}

  @Get()
  findAll(): Player[] {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Player {
    return this.svc.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: Partial<Player>): Player {
    return this.svc.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Player>): Player {
    return this.svc.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
