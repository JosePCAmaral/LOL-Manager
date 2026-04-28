import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { LeagueStageService } from './league-stage.service';
import { LeagueStage } from './league-stage.entity';
import { CreateLeagueStageDto } from './dto/create-league-stage.dto';
import { UpdateLeagueStageDto } from './dto/update-league-stage.dto';

@ApiTags('league-stages')
@Controller('league-stages')
export class LeagueStageController {
  constructor(private readonly svc: LeagueStageService) {}

  @Get()
  @ApiOperation({ summary: 'Listar fases da liga' })
  @ApiOkResponse({ description: 'Lista de fases retornada com sucesso.', type: LeagueStage, isArray: true })
  findAll(): LeagueStage[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fase por ID' })
  @ApiParam({ name: 'id', description: 'Identificador da fase' })
  @ApiOkResponse({ description: 'Fase encontrada com sucesso.', type: LeagueStage })
  findOne(@Param('id') id: string): LeagueStage {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar fase da liga' })
  @ApiBody({ type: CreateLeagueStageDto })
  @ApiCreatedResponse({ description: 'Fase criada com sucesso.', type: LeagueStage })
  create(@Body() dto: CreateLeagueStageDto): LeagueStage {
    return this.svc.create(dto as Partial<LeagueStage>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar fase da liga' })
  @ApiParam({ name: 'id', description: 'Identificador da fase' })
  @ApiBody({ type: UpdateLeagueStageDto })
  @ApiOkResponse({ description: 'Fase atualizada com sucesso.', type: LeagueStage })
  update(@Param('id') id: string, @Body() dto: UpdateLeagueStageDto): LeagueStage {
    return this.svc.update(Number(id), dto as Partial<LeagueStage>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover fase da liga' })
  @ApiParam({ name: 'id', description: 'Identificador da fase' })
  @ApiNoContentResponse({ description: 'Fase removida com sucesso.' })
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
