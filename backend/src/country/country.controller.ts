import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CountryService } from './country.service';
import { Country } from './country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Controller('countries')
export class CountryController {
  constructor(private readonly svc: CountryService) {}

  @Get()
  findAll(): Country[] {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Country {
    return this.svc.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: CreateCountryDto): Country {
    return this.svc.create(dto as Partial<Country>);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCountryDto): Country {
    return this.svc.update(Number(id), dto as Partial<Country>);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    return this.svc.remove(Number(id));
  }
}
