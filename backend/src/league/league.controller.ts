import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LeagueService } from './league.service';
import { League } from './league.entity';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';

@Controller('leagues')
export class LeagueController {
  constructor(private readonly svc: LeagueService) {}

  @Get()
  findAll(): League[] {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): League {
    return this.svc.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: CreateLeagueDto): League {
    return this.svc.create(dto as Partial<League>);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeagueDto): League {
    return this.svc.update(Number(id), dto as Partial<League>);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
