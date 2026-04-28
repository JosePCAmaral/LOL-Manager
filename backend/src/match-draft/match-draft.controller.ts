import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MatchDraftService } from './match-draft.service';
import { MatchDraft } from './match-draft.entity';
import { CreateMatchDraftDto } from './dto/create-match-draft.dto';

@ApiTags('match-drafts')
@Controller('match-drafts')
export class MatchDraftController {
  constructor(private readonly svc: MatchDraftService) {}

  @Get()
  @ApiOperation({ summary: 'Listar drafts de partida' })
  @ApiOkResponse({ description: 'Lista de drafts retornada com sucesso.', type: MatchDraft, isArray: true })
  findAll(): MatchDraft[] {
    return this.svc.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Criar draft de partida' })
  @ApiBody({ type: CreateMatchDraftDto })
  @ApiCreatedResponse({ description: 'Draft criado com sucesso.', type: MatchDraft })
  create(@Body() dto: CreateMatchDraftDto): MatchDraft {
    return this.svc.create(dto as Partial<MatchDraft>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover draft de partida' })
  @ApiParam({ name: 'id', description: 'Identificador do draft' })
  @ApiNoContentResponse({ description: 'Draft removido com sucesso.' })
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
