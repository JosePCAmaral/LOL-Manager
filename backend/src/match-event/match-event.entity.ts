export class MatchEvent {
  id!: number;
  match_id!: number;
  team_id!: number;
  player_id!: number;
  timestamp!: number;
  type!: string;
  positionX?: number;
  positionY?: number;
  data?: any;

  constructor(partial?: Partial<MatchEvent>) {
    if (partial) Object.assign(this, partial);
  }
}
