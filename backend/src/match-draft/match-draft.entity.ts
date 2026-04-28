export class MatchDraft {
  id!: number;
  match_id!: number;
  team_id!: number;
  championId!: number;
  type!: string;
  pickOrder!: number;

  constructor(partial?: Partial<MatchDraft>) {
    if (partial) Object.assign(this, partial);
  }
}
