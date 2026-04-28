export class SaveGame {
  id!: number;
  managerName!: string;
  current_team_id!: number;
  season!: number;
  split!: number;
  difficulty!: string;
  createdAt!: string;

  constructor(partial?: Partial<SaveGame>) {
    if (partial) Object.assign(this, partial);
  }
}
