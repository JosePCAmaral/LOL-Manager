import { Injectable, NotFoundException } from '@nestjs/common';
import { Team } from './team.entity';

@Injectable()
export class TeamService {
  private items = new Map<number, Team>();
  private nextId = 1;

  findAll(): Team[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): Team {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('Team not found');
    return it;
  }

  create(dto: Partial<Team>): Team {
    const id = this.nextId++;
    const ent = new Team({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<Team>): Team {
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
