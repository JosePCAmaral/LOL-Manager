import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchEvent } from './match-event.entity';

@Injectable()
export class MatchEventService {
  private items = new Map<number, MatchEvent>();
  private nextId = 1;

  findAll(): MatchEvent[] {
    return Array.from(this.items.values());
  }

  create(dto: Partial<MatchEvent>): MatchEvent {
    const id = this.nextId++;
    const ent = new MatchEvent({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  remove(id: number): void {
    if (!this.items.has(id)) throw new NotFoundException('MatchEvent not found');
    this.items.delete(id);
  }
}
