import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import { Player } from './player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@ApiTags('players')
@Controller('players')
export class PlayerController {
  constructor(private readonly svc: PlayerService) {}

  @Get()
  @ApiOperation({ summary: 'Listar jogadores' })
  @ApiOkResponse({ description: 'Lista de jogadores retornada com sucesso.', type: Player, isArray: true })
  async findAll(): Promise<Player[]> {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar jogador por ID' })
  @ApiParam({ name: 'id', description: 'Identificador do jogador' })
  @ApiOkResponse({ description: 'Jogador encontrado com sucesso.', type: Player })
  async findOne(@Param('id') id: string): Promise<Player> {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar jogador' })
  @ApiBody({ type: CreatePlayerDto })
  @ApiCreatedResponse({ description: 'Jogador criado com sucesso.', type: Player })
  async create(@Body() dto: CreatePlayerDto): Promise<Player> {
    return this.svc.create(dto as Partial<Player>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar jogador' })
  @ApiParam({ name: 'id', description: 'Identificador do jogador' })
  @ApiBody({ type: UpdatePlayerDto })
  @ApiOkResponse({ description: 'Jogador atualizado com sucesso.', type: Player })
  async update(@Param('id') id: string, @Body() dto: UpdatePlayerDto): Promise<Player> {
    return this.svc.update(Number(id), dto as Partial<Player>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover jogador' })
  @ApiParam({ name: 'id', description: 'Identificador do jogador' })
  @ApiNoContentResponse({ description: 'Jogador removido com sucesso.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.svc.remove(Number(id));
  }
}
