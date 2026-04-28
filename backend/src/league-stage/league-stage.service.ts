import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LeagueStage } from './league-stage.entity';

@Injectable()
export class LeagueStageService {
  private items = new Map<number, LeagueStage>();
  private nextId = 1;

  findAll(): LeagueStage[] {
    return Array.from(this.items.values());
  }

  /**
   * Retorna os stages de uma liga ordenados por startWeek, endWeek, orderIndex
   */
  findByLeagueOrdered(leagueId: number): LeagueStage[] {
    return this.findAll()
      .filter((s) => s.league_id === leagueId)
      .sort((a, b) => {
        const sa = a.startWeek ?? Number.MAX_SAFE_INTEGER;
        const sb = b.startWeek ?? Number.MAX_SAFE_INTEGER;
        if (sa !== sb) return sa - sb;
        const ea = a.endWeek ?? Number.MAX_SAFE_INTEGER;
        const eb = b.endWeek ?? Number.MAX_SAFE_INTEGER;
        if (ea !== eb) return ea - eb;
        const oa = a.orderIndex ?? 0;
        const ob = b.orderIndex ?? 0;
        return oa - ob;
      });
  }

  findOne(id: number): LeagueStage {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('LeagueStage not found');
    return it;
  }

  create(dto: Partial<LeagueStage>): LeagueStage {
    // validate required weeks
    if (dto.startWeek == null || dto.endWeek == null)
      throw new BadRequestException('startWeek and endWeek are required');
    if (dto.endWeek < dto.startWeek)
      throw new BadRequestException('endWeek must be >= startWeek');

    // check overlap within same league
    const overlaps = this.findAll().some((s) => {
      if (s.league_id !== dto.league_id) return false;
      // intervals overlap if startA <= endB && startB <= endA
      return !(dto.endWeek! < s.startWeek || (dto.startWeek! > s.endWeek));
    });
    if (overlaps) throw new BadRequestException('stage weeks overlap with existing stage in the same league');

    const id = this.nextId++;
    const ent = new LeagueStage({ id, ...dto });

    // set a default orderIndex if not provided (gaps of 10)
    if (ent.orderIndex == null) {
      const list = this.findByLeagueOrdered(ent.league_id);
      const pos = list.length + 1;
      ent.orderIndex = pos * 10;
    }

    this.items.set(id, ent);
    return ent;
  }

  update(id: number, dto: Partial<LeagueStage>): LeagueStage {
    const it = this.findOne(id);

    const newStart = dto.startWeek ?? it.startWeek;
    const newEnd = dto.endWeek ?? it.endWeek;
    if (newStart == null || newEnd == null)
      throw new BadRequestException('startWeek and endWeek are required');
    if (newEnd < newStart) throw new BadRequestException('endWeek must be >= startWeek');

    // check overlap with other stages in same league
    const overlaps = this.findAll().some((s) => {
      if (s.id === id) return false;
      if (s.league_id !== (dto.league_id ?? it.league_id)) return false;
      return !(newEnd < s.startWeek || newStart > s.endWeek);
    });
    if (overlaps) throw new BadRequestException('stage weeks overlap with existing stage in the same league');

    Object.assign(it, dto);
    // ensure orderIndex exists
    if (it.orderIndex == null) {
      const list = this.findByLeagueOrdered(it.league_id);
      const pos = list.findIndex((s) => s.id === it.id);
      it.orderIndex = (pos >= 0 ? pos + 1 : list.length + 1) * 10;
    }

    this.items.set(id, it);
    return it;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }
}
