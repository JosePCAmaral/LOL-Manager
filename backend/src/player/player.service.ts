import { Injectable, NotFoundException } from '@nestjs/common';
import { Player } from './player.entity';

@Injectable()
export class PlayerService {
  private items = new Map<number, Player>();
  private nextId = 1;

  findAll(): Player[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): Player {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('Player not found');
    return it;
  }

  create(dto: Partial<Player>): Player {
    const id = this.nextId++;
    const ent = new Player({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<Player>): Player {
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
