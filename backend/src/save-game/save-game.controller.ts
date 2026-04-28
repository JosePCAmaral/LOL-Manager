import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SaveGameService } from './save-game.service';
import { SaveGame } from './save-game.entity';
import { CreateSaveGameDto } from './dto/create-save-game.dto';

@ApiTags('save-games')
@Controller('save-games')
export class SaveGameController {
  constructor(private readonly svc: SaveGameService) {}

  @Get()
  @ApiOperation({ summary: 'Listar saves do jogo' })
  @ApiOkResponse({ description: 'Lista de saves retornada com sucesso.', type: SaveGame, isArray: true })
  findAll(): SaveGame[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar save por ID' })
  @ApiParam({ name: 'id', description: 'Identificador do save' })
  @ApiOkResponse({ description: 'Save encontrado com sucesso.', type: SaveGame })
  findOne(@Param('id') id: string): SaveGame {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar save do jogo' })
  @ApiBody({ type: CreateSaveGameDto })
  @ApiCreatedResponse({ description: 'Save criado com sucesso.', type: SaveGame })
  create(@Body() dto: CreateSaveGameDto): SaveGame {
    return this.svc.create(dto as Partial<SaveGame>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover save do jogo' })
  @ApiParam({ name: 'id', description: 'Identificador do save' })
  @ApiNoContentResponse({ description: 'Save removido com sucesso.' })
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
