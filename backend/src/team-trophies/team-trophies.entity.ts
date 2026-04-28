export class TeamTrophy {
  team_id!: number;
  league_id!: number;
  titles!: number;

  constructor(partial?: Partial<TeamTrophy>) {
    if (partial) Object.assign(this, partial);
  }
}
