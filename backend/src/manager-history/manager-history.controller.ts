import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ManagerHistoryService } from './manager-history.service';
import { ManagerHistory } from './manager-history.entity';
import { CreateManagerHistoryDto } from './dto/create-manager-history.dto';

@ApiTags('manager-history')
@Controller('manager-history')
export class ManagerHistoryController {
  constructor(private readonly svc: ManagerHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar histórico de managers' })
  @ApiOkResponse({ description: 'Histórico retornado com sucesso.', type: ManagerHistory, isArray: true })
  findAll(): ManagerHistory[] {
    return this.svc.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Criar registro no histórico' })
  @ApiBody({ type: CreateManagerHistoryDto })
  @ApiCreatedResponse({ description: 'Registro criado com sucesso.', type: ManagerHistory })
  create(@Body() dto: CreateManagerHistoryDto): ManagerHistory {
    return this.svc.create(dto as Partial<ManagerHistory>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro do histórico' })
  @ApiParam({ name: 'id', description: 'Identificador do registro' })
  @ApiNoContentResponse({ description: 'Registro removido com sucesso.' })
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
