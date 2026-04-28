import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { MatchEntity } from './match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@ApiTags('matches')
@Controller('matches')
export class MatchController {
  constructor(private readonly svc: MatchService) {}

  @Get()
  @ApiOperation({ summary: 'Listar partidas' })
  @ApiOkResponse({ description: 'Lista de partidas retornada com sucesso.', type: MatchEntity, isArray: true })
  findAll(): MatchEntity[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar partida por ID' })
  @ApiParam({ name: 'id', description: 'Identificador da partida' })
  @ApiOkResponse({ description: 'Partida encontrada com sucesso.', type: MatchEntity })
  findOne(@Param('id') id: string): MatchEntity {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar partida' })
  @ApiBody({ type: CreateMatchDto })
  @ApiCreatedResponse({ description: 'Partida criada com sucesso.', type: MatchEntity })
  create(@Body() dto: CreateMatchDto): MatchEntity {
    return this.svc.create(dto as Partial<MatchEntity>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar partida' })
  @ApiParam({ name: 'id', description: 'Identificador da partida' })
  @ApiBody({ type: UpdateMatchDto })
  @ApiOkResponse({ description: 'Partida atualizada com sucesso.', type: MatchEntity })
  update(@Param('id') id: string, @Body() dto: UpdateMatchDto): MatchEntity {
    return this.svc.update(Number(id), dto as Partial<MatchEntity>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover partida' })
  @ApiParam({ name: 'id', description: 'Identificador da partida' })
  @ApiNoContentResponse({ description: 'Partida removida com sucesso.' })
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
