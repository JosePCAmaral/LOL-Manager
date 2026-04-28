import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CountryService } from './country.service';
import { Country } from './country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@ApiTags('countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly svc: CountryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar países' })
  @ApiOkResponse({ description: 'Lista de países retornada com sucesso.', type: Country, isArray: true })
  findAll(): Country[] {
    return this.svc.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar país por ID' })
  @ApiParam({ name: 'id', description: 'Identificador do país' })
  @ApiOkResponse({ description: 'País encontrado com sucesso.', type: Country })
  findOne(@Param('id') id: string): Country {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Criar país' })
  @ApiBody({ type: CreateCountryDto })
  @ApiCreatedResponse({ description: 'País criado com sucesso.', type: Country })
  create(@Body() dto: CreateCountryDto): Country {
    return this.svc.create(dto as Partial<Country>);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar país' })
  @ApiParam({ name: 'id', description: 'Identificador do país' })
  @ApiBody({ type: UpdateCountryDto })
  @ApiOkResponse({ description: 'País atualizado com sucesso.', type: Country })
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto): Country {
    return this.svc.update(Number(id), dto as Partial<Country>);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover país' })
  @ApiParam({ name: 'id', description: 'Identificador do país' })
  @ApiNoContentResponse({ description: 'País removido com sucesso.' })
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
