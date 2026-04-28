import { Injectable, NotFoundException } from '@nestjs/common';
import { League } from './league.entity';

@Injectable()
export class LeagueService {
  private items = new Map<number, League>();
  private nextId = 1;

  findAll(): League[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): League {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('League not found');
    return it;
  }

  create(dto: Partial<League>): League {
    const id = this.nextId++;
    const ent = new League({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<League>): League {
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
