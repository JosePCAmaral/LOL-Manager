import { Injectable, NotFoundException } from '@nestjs/common';
import { LeagueMovementRule } from './league-movement-rule.entity';
import { MovementType } from '../common/enums/movement-type.enum';

@Injectable()
export class LeagueMovementRuleService {
  private items = new Map<number, LeagueMovementRule>();
  private nextId = 1;

  findAll(): LeagueMovementRule[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): LeagueMovementRule {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('LeagueMovementRule not found');
    return it;
  }

  create(dto: Partial<LeagueMovementRule>): LeagueMovementRule {
    const id = this.nextId++;
    const ent = new LeagueMovementRule({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<LeagueMovementRule>): LeagueMovementRule {
    const it = this.findOne(id);
    Object.assign(it, dto);
    this.items.set(id, it);
    return it;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }

  // End-of-season movement should live here so tier logic stays isolated.
  resolveMovements(
    standings: Array<{ teamId: number; rank: number }>,
    season: number,
    leagueId: number,
  ): Array<{ teamId: number; movementType: MovementType; toLeagueId: number }> {
    const rules = this.findAll().filter((r) => r.season === season && r.fromLeagueId === leagueId);
    const movements: Array<{ teamId: number; movementType: MovementType; toLeagueId: number }> = [];

    for (const rule of rules) {
      if (rule.movementType === MovementType.PROMOTION) {
        const promoted = standings.filter((s) => s.rank <= rule.spots);
        for (const p of promoted) {
          movements.push({ teamId: p.teamId, movementType: MovementType.PROMOTION, toLeagueId: rule.toLeagueId });
        }
      }

      if (rule.movementType === MovementType.RELEGATION) {
        const relegated = standings.slice(Math.max(standings.length - rule.spots, 0));
        for (const r of relegated) {
          movements.push({ teamId: r.teamId, movementType: MovementType.RELEGATION, toLeagueId: rule.toLeagueId });
        }
      }
    }

    return movements;
  }
}
