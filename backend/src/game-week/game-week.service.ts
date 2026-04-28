import { Injectable, NotFoundException } from '@nestjs/common';
import { GameWeek } from './game-week.entity';
import { GameWeekStatus } from '../common/enums/game-week-status.enum';

@Injectable()
export class GameWeekService {
  private items = new Map<number, GameWeek>();
  private nextId = 1;

  findAll(): GameWeek[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): GameWeek {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('GameWeek not found');
    return it;
  }

  create(dto: Partial<GameWeek>): GameWeek {
    const id = this.nextId++;
    const ent = new GameWeek({ id, status: GameWeekStatus.UPCOMING, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<GameWeek>): GameWeek {
    const it = this.findOne(id);
    Object.assign(it, dto);
    this.items.set(id, it);
    return it;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }

  setActiveWeek(season: number, weekNumber: number): GameWeek[] {
    const all = this.findAll().filter((w) => w.season === season);
    for (const w of all) {
      if (w.weekNumber < weekNumber) w.status = GameWeekStatus.FINISHED;
      if (w.weekNumber === weekNumber) w.status = GameWeekStatus.ACTIVE;
      if (w.weekNumber > weekNumber) w.status = GameWeekStatus.UPCOMING;
    }
    return all;
  }
}
