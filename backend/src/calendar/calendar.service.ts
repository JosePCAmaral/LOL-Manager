import { Injectable } from '@nestjs/common';
import { GameWeekService } from '../game-week/game-week.service';
import { GameWeek } from '../game-week/game-week.entity';
import { MatchEntity } from '../match/match.entity';
import { SplitType } from '../common/enums/split-type.enum';
import { MatchStatus } from '../common/enums/match-status.enum';

@Injectable()
export class CalendarService {
  constructor(private readonly gameWeekService: GameWeekService) {}

  // Calendar generation lives here.
  // This service should orchestrate weeks and match distribution, while controllers only receive requests.
  generateSeasonWeeks(
    season: number,
    split: SplitType,
    totalWeeks: number,
    startDateISO: string,
  ): GameWeek[] {
    const startDate = new Date(startDateISO);
    const generated: GameWeek[] = [];

    for (let week = 1; week <= totalWeeks; week++) {
      const startsAt = new Date(startDate);
      startsAt.setDate(startDate.getDate() + (week - 1) * 7);
      const endsAt = new Date(startsAt);
      endsAt.setDate(startsAt.getDate() + 6);

      generated.push(
        this.gameWeekService.create({
          season,
          split,
          weekNumber: week,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      );
    }

    return generated;
  }

  // Match slot assignment also stays in this service.
  // It keeps scheduling policy centralized and easy to evolve.
  distributeMatchesByWeek(
    matches: MatchEntity[],
    season: number,
    split: SplitType,
    startWeek: number,
    endWeek: number,
  ): MatchEntity[] {
    const totalWeeks = Math.max(endWeek - startWeek + 1, 1);

    return matches.map((m, idx) => {
      const weekOffset = idx % totalWeeks;
      const assignedWeek = startWeek + weekOffset;
      return new MatchEntity({
        ...m,
        season,
        split,
        weekNumber: assignedWeek,
        roundNumber: Math.floor(idx / totalWeeks) + 1,
        status: MatchStatus.SCHEDULED,
      });
    });
  }
}
