export class TeamRival {
  team_id_1!: number;
  team_id_2!: number;
  intensity!: number;

  constructor(partial?: Partial<TeamRival>) {
    if (partial) Object.assign(this, partial);
  }
}
