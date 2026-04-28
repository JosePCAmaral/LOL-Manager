import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'teams' })
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'int', nullable: true })
  country_id!: number;

  @Column({ type: 'int', nullable: true })
  league_id!: number;

  @Column({ type: 'int', default: 0 })
  coachLevel!: number;

  @Column({ type: 'int', default: 0 })
  infrastructureLevel!: number;

  @Column({ type: 'int', default: 0 })
  synergy!: number;

  @Column({ type: 'int', default: 0 })
  reputation!: number;

  @Column({ type: 'int', default: 0 })
  budget!: number;

  @Column({ type: 'int', default: 0 })
  transferBudget!: number;

  @Column({ type: 'int', default: 0 })
  salaryBudget!: number;

  @Column({ type: 'int', default: 0 })
  earlyGame!: number;

  @Column({ type: 'int', default: 0 })
  midGame!: number;

  @Column({ type: 'int', default: 0 })
  lateGame!: number;

  @Column({ type: 'int', default: 0 })
  teamFight!: number;

  @Column({ type: 'int', default: 0 })
  objectiveControl!: number;

  @Column({ type: 'int', default: 0 })
  visionControl!: number;

  @Column({ type: 'int', default: 0 })
  tempoControl!: number;

  constructor(partial?: Partial<Team>) {
    if (partial) Object.assign(this, partial);
  }
}
