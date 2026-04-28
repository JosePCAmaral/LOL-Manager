export class Team {
  id!: number;
  name!: string;
  country_id!: number;
  league_id!: number;
  coachLevel!: number;
  infrastructureLevel!: number;
  synergy!: number;
  reputation!: number;
  budget!: number;
  transferBudget!: number;
  salaryBudget!: number;
  earlyGame!: number;
  midGame!: number;
  lateGame!: number;
  teamFight!: number;
  objectiveControl!: number;
  visionControl!: number;
  tempoControl!: number;

  constructor(partial?: Partial<Team>) {
    if (partial) Object.assign(this, partial);
  }
}
