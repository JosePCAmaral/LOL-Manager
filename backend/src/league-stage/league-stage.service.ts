import { Injectable, NotFoundException } from '@nestjs/common';
import { LeagueStage } from './league-stage.entity';

@Injectable()
export class LeagueStageService {
  private items = new Map<number, LeagueStage>();
  private nextId = 1;

  findAll(): LeagueStage[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): LeagueStage {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('LeagueStage not found');
    return it;
  }

  create(dto: Partial<LeagueStage>): LeagueStage {
    const id = this.nextId++;
    const ent = new LeagueStage({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<LeagueStage>): LeagueStage {
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
