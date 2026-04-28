export class Player {
  id!: number;
  name!: string;
  team_id!: number;
  country_id!: number;
  position!: string;
  age!: number;
  contractUntil!: number;
  salary!: number;
  ratingOVR!: number;
  mechanics!: number;
  macro!: number;
  consistency!: number;
  aggression!: number;
  vision!: number;
  objective!: number;
  adaptability!: number;
  clutch!: number;
  potential!: number;
  morale!: number;
  form!: number;
  marketValue!: number;

  constructor(partial?: Partial<Player>) {
    if (partial) Object.assign(this, partial);
  }
}
