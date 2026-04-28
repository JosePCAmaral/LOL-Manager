import { Injectable, NotFoundException } from '@nestjs/common';
import { SaveGame } from './save-game.entity';

@Injectable()
export class SaveGameService {
  private items = new Map<number, SaveGame>();
  private nextId = 1;

  findAll(): SaveGame[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): SaveGame {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('SaveGame not found');
    return it;
  }

  create(dto: Partial<SaveGame>): SaveGame {
    const id = this.nextId++;
    const ent = new SaveGame({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }
}
