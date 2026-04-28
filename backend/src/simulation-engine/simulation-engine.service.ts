import { Injectable } from '@nestjs/common';
import { MatchContext, MatchResult } from './simulation.types';

@Injectable()
export class SimulationEngineService {
  // Placeholder: orchestrates match simulation using domain data
  async runMatch(ctx: MatchContext): Promise<MatchResult> {
    // TODO: use repositories to load teams / players and compute probabilities
    // For now return a deterministic stub
    const res: MatchResult = {
      homeScore: 1,
      awayScore: 0,
      events: [
        { minute: 23, type: 'goal', description: 'Home team scored' },
      ],
    };
    return res;
  }
}
