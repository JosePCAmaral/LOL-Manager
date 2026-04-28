import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { TeamTrophiesService } from './team-trophies.service';
import { TeamTrophy } from './team-trophies.entity';

@Controller('team-trophies')
export class TeamTrophiesController {
  constructor(private readonly svc: TeamTrophiesService) {}

  @Get()
  findAll(): TeamTrophy[] {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: Partial<TeamTrophy>): TeamTrophy {
    return this.svc.create(dto);
  }

  @Delete(':team/:league')
  remove(@Param('team') team: string, @Param('league') league: string) {
    return this.svc.remove(Number(team), Number(league));
  }
}
