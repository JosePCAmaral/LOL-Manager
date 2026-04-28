import { Injectable, NotFoundException } from '@nestjs/common';
import { TeamRival } from './team-rivals.entity';

@Injectable()
export class TeamRivalsService {
  private items = new Map<string, TeamRival>();

  private key(a: number, b: number) {
    return `${Math.min(a, b)}-${Math.max(a, b)}`;
  }

  findAll(): TeamRival[] {
    return Array.from(this.items.values());
  }

  findOne(teamA: number, teamB: number): TeamRival {
    const it = this.items.get(this.key(teamA, teamB));
    if (!it) throw new NotFoundException('Rivalry not found');
    return it;
  }

  create(dto: Partial<TeamRival>): TeamRival {
    const teamId1 = dto.team_id_1 ?? 0;
    const teamId2 = dto.team_id_2 ?? 0;
    const key = this.key(teamId1, teamId2);
    const ent = new TeamRival({ ...dto } as Partial<TeamRival>);
    this.items.set(key, ent);
    return ent;
  }

  update(teamA: number, teamB: number, dto: Partial<TeamRival>): TeamRival {
    const it = this.findOne(teamA, teamB);
    Object.assign(it, dto);
    this.items.set(this.key(teamA, teamB), it);
    return it;
  }

  remove(teamA: number, teamB: number): void {
    this.findOne(teamA, teamB);
    this.items.delete(this.key(teamA, teamB));
  }
}
