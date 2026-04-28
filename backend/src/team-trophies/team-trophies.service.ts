import { Injectable, NotFoundException } from '@nestjs/common';
import { TeamTrophy } from './team-trophies.entity';

@Injectable()
export class TeamTrophiesService {
  private items = new Map<string, TeamTrophy>();

  private key(team: number, league: number) {
    return `${team}-${league}`;
  }

  findAll(): TeamTrophy[] {
    return Array.from(this.items.values());
  }

  create(dto: Partial<TeamTrophy>): TeamTrophy {
    const ent = new TeamTrophy({ ...dto } as Partial<TeamTrophy>);
    const teamId = dto.team_id ?? 0;
    const leagueId = dto.league_id ?? 0;
    this.items.set(this.key(teamId, leagueId), ent);
    return ent;
  }

  remove(team: number, league: number): void {
    const k = this.key(team, league);
    if (!this.items.has(k)) throw new NotFoundException('TeamTrophy not found');
    this.items.delete(k);
  }
}
