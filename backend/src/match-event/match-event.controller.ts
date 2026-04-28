import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MatchEventService } from './match-event.service';
import { MatchEvent } from './match-event.entity';
import { CreateMatchEventDto } from './dto/create-match-event.dto';

@ApiTags('match-events')
@Controller('match-events')
export class MatchEventController {
  constructor(private readonly svc: MatchEventService) {}

  @Get()
  @ApiOperation({ summary: 'Listar eventos de partida' })
  @ApiOkResponse({ description: 'Lista de eventos retornada com sucesso.', type: MatchEvent, isArray: true })
  findAll(): MatchEvent[] {
    return this.svc.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Criar evento de partida' })
  @ApiBody({ type: CreateMatchEventDto })
  @ApiCreatedResponse({ description: 'Evento criado com sucesso.', type: MatchEvent })
  create(@Body() dto: CreateMatchEventDto): MatchEvent {
    return this.svc.create(dto as Partial<MatchEvent>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover evento de partida' })
  @ApiParam({ name: 'id', description: 'Identificador do evento' })
  @ApiNoContentResponse({ description: 'Evento removido com sucesso.' })
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
