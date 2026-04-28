export class ManagerHistory {
  id!: number;
  save_id!: number;
  team_id!: number;
  startDate!: string;
  endDate?: string;
  titlesWon!: number;
  reasonLeft!: string;

  constructor(partial?: Partial<ManagerHistory>) {
    if (partial) Object.assign(this, partial);
  }
}
