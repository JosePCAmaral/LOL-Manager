import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { LeagueMovementRuleService } from './league-movement-rule.service';
import { LeagueMovementRule } from './league-movement-rule.entity';
import { CreateLeagueMovementRuleDto } from './dto/create-league-movement-rule.dto';
import { UpdateLeagueMovementRuleDto } from './dto/update-league-movement-rule.dto';

@ApiTags('league-movement-rules')
@Controller('league-movement-rules')
export class LeagueMovementRuleController {
  constructor(private readonly svc: LeagueMovementRuleService) {}

  @Get()
  @ApiOperation({ summary: 'Listar regras de movimentação entre ligas' })
  @ApiOkResponse({ description: 'Lista de regras retornada com sucesso.', type: LeagueMovementRule, isArray: true })
  findAll(): LeagueMovementRule[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar regra de movimentação por ID' })
  @ApiParam({ name: 'id', description: 'Identificador da regra' })
  @ApiOkResponse({ description: 'Regra encontrada com sucesso.', type: LeagueMovementRule })
  findOne(@Param('id') id: string): LeagueMovementRule {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar regra de movimentação entre ligas' })
  @ApiBody({ type: CreateLeagueMovementRuleDto })
  @ApiCreatedResponse({ description: 'Regra criada com sucesso.', type: LeagueMovementRule })
  create(@Body() dto: CreateLeagueMovementRuleDto): LeagueMovementRule {
    return this.svc.create(dto as Partial<LeagueMovementRule>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar regra de movimentação entre ligas' })
  @ApiParam({ name: 'id', description: 'Identificador da regra' })
  @ApiBody({ type: UpdateLeagueMovementRuleDto })
  @ApiOkResponse({ description: 'Regra atualizada com sucesso.', type: LeagueMovementRule })
  update(@Param('id') id: string, @Body() dto: UpdateLeagueMovementRuleDto): LeagueMovementRule {
    return this.svc.update(Number(id), dto as Partial<LeagueMovementRule>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover regra de movimentação entre ligas' })
  @ApiParam({ name: 'id', description: 'Identificador da regra' })
  @ApiNoContentResponse({ description: 'Regra removida com sucesso.' })
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
