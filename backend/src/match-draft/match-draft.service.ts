import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchDraft } from './match-draft.entity';

@Injectable()
export class MatchDraftService {
  private items = new Map<number, MatchDraft>();
  private nextId = 1;

  findAll(): MatchDraft[] {
    return Array.from(this.items.values());
  }

  create(dto: Partial<MatchDraft>): MatchDraft {
    const id = this.nextId++;
    const ent = new MatchDraft({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  remove(id: number): void {
    if (!this.items.has(id)) throw new NotFoundException('MatchDraft not found');
    this.items.delete(id);
  }
}
