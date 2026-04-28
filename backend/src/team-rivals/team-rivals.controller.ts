import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TeamRivalsService } from './team-rivals.service';
import { TeamRival } from './team-rivals.entity';
import { CreateTeamRivalDto } from './dto/create-team-rival.dto';
import { UpdateTeamRivalDto } from './dto/update-team-rival.dto';

@ApiTags('team-rivals')
@Controller('team-rivals')
export class TeamRivalsController {
  constructor(private readonly svc: TeamRivalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar rivalidades entre times' })
  @ApiOkResponse({ description: 'Lista de rivalidades retornada com sucesso.', type: TeamRival, isArray: true })
  findAll(): TeamRival[] {
    return this.svc.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Criar rivalidade entre times' })
  @ApiBody({ type: CreateTeamRivalDto })
  @ApiCreatedResponse({ description: 'Rivalidade criada com sucesso.', type: TeamRival })
  create(@Body() dto: CreateTeamRivalDto): TeamRival {
    return this.svc.create(dto as Partial<TeamRival>);
  }

  @Put(':teamA/:teamB')
  @ApiOperation({ summary: 'Atualizar rivalidade entre times' })
  @ApiParam({ name: 'teamA', description: 'Identificador do primeiro time' })
  @ApiParam({ name: 'teamB', description: 'Identificador do segundo time' })
  @ApiBody({ type: UpdateTeamRivalDto })
  @ApiOkResponse({ description: 'Rivalidade atualizada com sucesso.', type: TeamRival })
  update(@Param('teamA') teamA: string, @Param('teamB') teamB: string, @Body() dto: UpdateTeamRivalDto) {
    return this.svc.update(Number(teamA), Number(teamB), dto as Partial<TeamRival>);
  }

  @Delete(':teamA/:teamB')
  @ApiOperation({ summary: 'Remover rivalidade entre times' })
  @ApiParam({ name: 'teamA', description: 'Identificador do primeiro time' })
  @ApiParam({ name: 'teamB', description: 'Identificador do segundo time' })
  @ApiNoContentResponse({ description: 'Rivalidade removida com sucesso.' })
  remove(@Param('teamA') teamA: string, @Param('teamB') teamB: string) {
    return this.svc.remove(Number(teamA), Number(teamB));
  }
}
