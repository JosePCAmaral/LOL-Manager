import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchEntity } from './match.entity';

@Injectable()
export class MatchService {
  private items = new Map<number, MatchEntity>();
  private nextId = 1;

  findAll(): MatchEntity[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): MatchEntity {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('Match not found');
    return it;
  }

  create(dto: Partial<MatchEntity>): MatchEntity {
    const id = this.nextId++;
    const ent = new MatchEntity({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }
}
