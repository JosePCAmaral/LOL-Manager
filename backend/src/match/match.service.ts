import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchEntity } from './match.entity';
import { SimulationEngineService } from '../simulation-engine/simulation-engine.service';
import { MatchResult } from '../simulation-engine/simulation.types';

@Injectable()
export class MatchService {
  private items = new Map<number, MatchEntity>();
  private nextId = 1;

  constructor(private readonly engine: SimulationEngineService) {}

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

  update(id: number, dto: Partial<MatchEntity>): MatchEntity {
    const it = this.findOne(id);
    Object.assign(it, dto);
    this.items.set(id, it);
    return it;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }

  // Example integration: run simulation for a stored match (does not persist results)
  async simulate(id: number): Promise<MatchResult> {
    const m = this.findOne(id);
    const ctx = { homeTeamId: m.teamA_id, awayTeamId: m.teamB_id };
    return this.engine.runMatch(ctx);
  }
}
