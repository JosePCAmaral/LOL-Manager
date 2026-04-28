import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LeagueStageService } from './league-stage.service';
import { LeagueStage } from './league-stage.entity';
import { CreateLeagueStageDto } from './dto/create-league-stage.dto';
import { UpdateLeagueStageDto } from './dto/update-league-stage.dto';

@Controller('league-stages')
export class LeagueStageController {
  constructor(private readonly svc: LeagueStageService) {}

  @Get()
  findAll(): LeagueStage[] {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): LeagueStage {
    return this.svc.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: CreateLeagueStageDto): LeagueStage {
    return this.svc.create(dto as Partial<LeagueStage>);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeagueStageDto): LeagueStage {
    return this.svc.update(Number(id), dto as Partial<LeagueStage>);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
