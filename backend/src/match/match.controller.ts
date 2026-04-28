import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchEntity } from './match.entity';

@Controller('matches')
export class MatchController {
  constructor(private readonly svc: MatchService) {}

  @Get()
  findAll(): MatchEntity[] {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): MatchEntity {
    return this.svc.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: Partial<MatchEntity>): MatchEntity {
    return this.svc.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
