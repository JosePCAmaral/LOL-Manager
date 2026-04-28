import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TeamTrophiesService } from './team-trophies.service';
import { TeamTrophy } from './team-trophies.entity';
import { CreateTeamTrophyDto } from './dto/create-team-trophy.dto';

@ApiTags('team-trophies')
@Controller('team-trophies')
export class TeamTrophiesController {
  constructor(private readonly svc: TeamTrophiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar troféus dos times' })
  @ApiOkResponse({ description: 'Lista de troféus retornada com sucesso.', type: TeamTrophy, isArray: true })
  findAll(): TeamTrophy[] {
    return this.svc.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Criar troféu do time' })
  @ApiBody({ type: CreateTeamTrophyDto })
  @ApiCreatedResponse({ description: 'Troféu criado com sucesso.', type: TeamTrophy })
  create(@Body() dto: CreateTeamTrophyDto): TeamTrophy {
    return this.svc.create(dto as Partial<TeamTrophy>);
  }

  @Delete(':team/:league')
  @ApiOperation({ summary: 'Remover troféu do time' })
  @ApiParam({ name: 'team', description: 'Identificador do time' })
  @ApiParam({ name: 'league', description: 'Identificador da liga' })
  @ApiNoContentResponse({ description: 'Troféu removido com sucesso.' })
  remove(@Param('team') team: string, @Param('league') league: string) {
    return this.svc.remove(Number(team), Number(league));
  }
}
