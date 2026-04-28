import { Injectable } from '@nestjs/common';
import {
  SplitType,
  LeagueStageType,
  LeagueStageFormat,
  MatchStatus,
  TransitionConditionType,
  MovementType,
  GameWeekStatus,
} from './enums';

@Injectable()
export class CommonService {
  getEnums() {
    return {
      splitTypes: Object.values(SplitType),
      leagueStageTypes: Object.values(LeagueStageType),
      leagueStageFormats: Object.values(LeagueStageFormat),
      matchStatuses: Object.values(MatchStatus),
      transitionConditionTypes: Object.values(TransitionConditionType),
      movementTypes: Object.values(MovementType),
      gameWeekStatuses: Object.values(GameWeekStatus),
    };
  }
}
