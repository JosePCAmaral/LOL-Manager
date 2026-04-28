import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TeamRivalsService } from './team-rivals.service';
import { TeamRival } from './team-rivals.entity';

@Controller('team-rivals')
export class TeamRivalsController {
  constructor(private readonly svc: TeamRivalsService) {}

  @Get()
  findAll(): TeamRival[] {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: Partial<TeamRival>): TeamRival {
    return this.svc.create(dto);
  }

  @Put(':teamA/:teamB')
  update(@Param('teamA') teamA: string, @Param('teamB') teamB: string, @Body() dto: Partial<TeamRival>) {
    return this.svc.update(Number(teamA), Number(teamB), dto);
  }

  @Delete(':teamA/:teamB')
  remove(@Param('teamA') teamA: string, @Param('teamB') teamB: string) {
    return this.svc.remove(Number(teamA), Number(teamB));
  }
}
