import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GameWeekService } from './game-week.service';
import { GameWeek } from './game-week.entity';
import { CreateGameWeekDto } from './dto/create-game-week.dto';
import { UpdateGameWeekDto } from './dto/update-game-week.dto';

@ApiTags('game-weeks')
@Controller('game-weeks')
export class GameWeekController {
  constructor(private readonly svc: GameWeekService) {}

  @Get()
  @ApiOperation({ summary: 'Listar semanas da temporada' })
  @ApiOkResponse({ description: 'Lista de semanas retornada com sucesso.', type: GameWeek, isArray: true })
  findAll(): GameWeek[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar semana por ID' })
  @ApiParam({ name: 'id', description: 'Identificador da semana' })
  @ApiOkResponse({ description: 'Semana encontrada com sucesso.', type: GameWeek })
  findOne(@Param('id') id: string): GameWeek {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar semana da temporada' })
  @ApiBody({ type: CreateGameWeekDto })
  @ApiCreatedResponse({ description: 'Semana criada com sucesso.', type: GameWeek })
  create(@Body() dto: CreateGameWeekDto): GameWeek {
    return this.svc.create(dto as Partial<GameWeek>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar semana da temporada' })
  @ApiParam({ name: 'id', description: 'Identificador da semana' })
  @ApiBody({ type: UpdateGameWeekDto })
  @ApiOkResponse({ description: 'Semana atualizada com sucesso.', type: GameWeek })
  update(@Param('id') id: string, @Body() dto: UpdateGameWeekDto): GameWeek {
    return this.svc.update(Number(id), dto as Partial<GameWeek>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover semana da temporada' })
  @ApiParam({ name: 'id', description: 'Identificador da semana' })
  @ApiNoContentResponse({ description: 'Semana removida com sucesso.' })
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
