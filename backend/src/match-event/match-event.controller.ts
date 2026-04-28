import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { MatchEventService } from './match-event.service';
import { MatchEvent } from './match-event.entity';

@Controller('match-events')
export class MatchEventController {
  constructor(private readonly svc: MatchEventService) {}

  @Get()
  findAll(): MatchEvent[] {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: Partial<MatchEvent>): MatchEvent {
    return this.svc.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
