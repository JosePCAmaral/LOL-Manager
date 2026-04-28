export interface MatchContext {
  homeTeamId: number;
  awayTeamId: number;
  stageId?: number;
}

export interface PlayerEvent {
  minute: number;
  type: string;
  description?: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: PlayerEvent[];
}
