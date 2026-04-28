import { Injectable, NotFoundException } from '@nestjs/common';
import { Country } from './country.entity';

@Injectable()
export class CountryService {
  private items = new Map<number, Country>();
  private nextId = 1;

  findAll(): Country[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): Country {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('Country not found');
    return it;
  }

  create(dto: Partial<Country>): Country {
    const id = this.nextId++;
    const ent = new Country({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<Country>): Country {
    const it = this.findOne(id);
    Object.assign(it, dto);
    this.items.set(id, it);
    return it;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }
}
