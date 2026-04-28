import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { Team } from './team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('teams')
@Controller('teams')
export class TeamController {
  constructor(private readonly svc: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'Listar times' })
  @ApiOkResponse({ description: 'Lista de times retornada com sucesso.', type: Team, isArray: true })
  async findAll(): Promise<Team[]> {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar time por ID' })
  @ApiParam({ name: 'id', description: 'Identificador do time' })
  @ApiOkResponse({ description: 'Time encontrado com sucesso.', type: Team })
  async findOne(@Param('id') id: string): Promise<Team> {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar time' })
  @ApiBody({ type: CreateTeamDto })
  @ApiCreatedResponse({ description: 'Time criado com sucesso.', type: Team })
  async create(@Body() dto: CreateTeamDto): Promise<Team> {
    return this.svc.create(dto as Partial<Team>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar time' })
  @ApiParam({ name: 'id', description: 'Identificador do time' })
  @ApiBody({ type: UpdateTeamDto })
  @ApiOkResponse({ description: 'Time atualizado com sucesso.', type: Team })
  async update(@Param('id') id: string, @Body() dto: UpdateTeamDto): Promise<Team> {
    return this.svc.update(Number(id), dto as Partial<Team>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover time' })
  @ApiParam({ name: 'id', description: 'Identificador do time' })
  @ApiNoContentResponse({ description: 'Time removido com sucesso.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.svc.remove(Number(id));
  }
}
