export class MatchPlayerStats {
  id!: number;
  match_id!: number;
  player_id!: number;
  kills!: number;
  deaths!: number;
  assists!: number;
  cs!: number;
  damage!: number;
  visionScore!: number;

  constructor(partial?: Partial<MatchPlayerStats>) {
    if (partial) Object.assign(this, partial);
  }
}
