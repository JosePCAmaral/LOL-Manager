import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TeamService } from './team.service';
import { Team } from './team.entity';

@Controller('teams')
export class TeamController {
  constructor(private readonly svc: TeamService) {}

  @Get()
  findAll(): Team[] {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Team {
    return this.svc.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: Partial<Team>): Team {
    return this.svc.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Team>): Team {
    return this.svc.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
