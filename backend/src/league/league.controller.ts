import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { LeagueService } from './league.service';
import { League } from './league.entity';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';

@ApiTags('leagues')
@Controller('leagues')
export class LeagueController {
  constructor(private readonly svc: LeagueService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ligas' })
  @ApiOkResponse({ description: 'Lista de ligas retornada com sucesso.', type: League, isArray: true })
  findAll(): League[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar liga por ID' })
  @ApiParam({ name: 'id', description: 'Identificador da liga' })
  @ApiOkResponse({ description: 'Liga encontrada com sucesso.', type: League })
  findOne(@Param('id') id: string): League {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar liga' })
  @ApiBody({ type: CreateLeagueDto })
  @ApiCreatedResponse({ description: 'Liga criada com sucesso.', type: League })
  create(@Body() dto: CreateLeagueDto): League {
    return this.svc.create(dto as Partial<League>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar liga' })
  @ApiParam({ name: 'id', description: 'Identificador da liga' })
  @ApiBody({ type: UpdateLeagueDto })
  @ApiOkResponse({ description: 'Liga atualizada com sucesso.', type: League })
  update(@Param('id') id: string, @Body() dto: UpdateLeagueDto): League {
    return this.svc.update(Number(id), dto as Partial<League>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover liga' })
  @ApiParam({ name: 'id', description: 'Identificador da liga' })
  @ApiNoContentResponse({ description: 'Liga removida com sucesso.' })
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
