import { Injectable, NotFoundException } from '@nestjs/common';
import { StageTransitionRule } from './stage-transition-rule.entity';

@Injectable()
export class StageTransitionRuleService {
  private items = new Map<number, StageTransitionRule>();
  private nextId = 1;

  findAll(): StageTransitionRule[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): StageTransitionRule {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('StageTransitionRule not found');
    return it;
  }

  create(dto: Partial<StageTransitionRule>): StageTransitionRule {
    const id = this.nextId++;
    const ent = new StageTransitionRule({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<StageTransitionRule>): StageTransitionRule {
    const it = this.findOne(id);
    Object.assign(it, dto);
    this.items.set(id, it);
    return it;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }

  // This logic decides which teams advance from one stage to another.
  // It should stay here, not in controller, to keep route handlers thin.
  applyTransitionRules(
    standings: Array<{ teamId: number; rank: number }>,
    fromStageId: number,
  ): Array<{ teamId: number; toStageId: number; seed?: number }> {
    const rules = this.findAll().filter((r) => r.fromStageId === fromStageId);
    const result: Array<{ teamId: number; toStageId: number; seed?: number }> = [];

    for (const rule of rules) {
      const range = standings.filter((s) => s.rank >= rule.rankFrom && s.rank <= rule.rankTo);
      for (let i = 0; i < range.length; i++) {
        result.push({
          teamId: range[i].teamId,
          toStageId: rule.toStageId,
          seed: rule.targetSeedStart ? rule.targetSeedStart + i : undefined,
        });
      }
    }

    return result;
  }
}
