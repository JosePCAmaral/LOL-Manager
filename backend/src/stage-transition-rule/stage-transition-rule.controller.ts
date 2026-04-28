import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { StageTransitionRuleService } from './stage-transition-rule.service';
import { StageTransitionRule } from './stage-transition-rule.entity';
import { CreateStageTransitionRuleDto } from './dto/create-stage-transition-rule.dto';
import { UpdateStageTransitionRuleDto } from './dto/update-stage-transition-rule.dto';

@ApiTags('stage-transition-rules')
@Controller('stage-transition-rules')
export class StageTransitionRuleController {
  constructor(private readonly svc: StageTransitionRuleService) {}

  @Get()
  @ApiOperation({ summary: 'Listar regras de transição de estágio' })
  @ApiOkResponse({ description: 'Lista de regras retornada com sucesso.', type: StageTransitionRule, isArray: true })
  findAll(): StageTransitionRule[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar regra de transição por ID' })
  @ApiParam({ name: 'id', description: 'Identificador da regra' })
  @ApiOkResponse({ description: 'Regra encontrada com sucesso.', type: StageTransitionRule })
  findOne(@Param('id') id: string): StageTransitionRule {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar regra de transição de estágio' })
  @ApiBody({ type: CreateStageTransitionRuleDto })
  @ApiCreatedResponse({ description: 'Regra criada com sucesso.', type: StageTransitionRule })
  create(@Body() dto: CreateStageTransitionRuleDto): StageTransitionRule {
    return this.svc.create(dto as Partial<StageTransitionRule>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar regra de transição de estágio' })
  @ApiParam({ name: 'id', description: 'Identificador da regra' })
  @ApiBody({ type: UpdateStageTransitionRuleDto })
  @ApiOkResponse({ description: 'Regra atualizada com sucesso.', type: StageTransitionRule })
  update(@Param('id') id: string, @Body() dto: UpdateStageTransitionRuleDto): StageTransitionRule {
    return this.svc.update(Number(id), dto as Partial<StageTransitionRule>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover regra de transição de estágio' })
  @ApiParam({ name: 'id', description: 'Identificador da regra' })
  @ApiNoContentResponse({ description: 'Regra removida com sucesso.' })
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
