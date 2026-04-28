export class MatchEntity {
  id!: number;
  league_stage_id!: number;
  teamA_id!: number;
  teamB_id!: number;
  winnerTeam_id?: number;
  duration?: number;
  playedAt?: string;
  isSimulated?: boolean;

  constructor(partial?: Partial<MatchEntity>) {
    if (partial) Object.assign(this, partial);
  }
}
