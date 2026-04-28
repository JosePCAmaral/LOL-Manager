import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'players' })
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'int', nullable: true })
  team_id!: number;

  @Column({ type: 'int', nullable: true })
  country_id!: number;

  @Column({ default: 'mid' })
  position!: string;

  @Column({ type: 'int', default: 18 })
  age!: number;

  @Column({ type: 'int', nullable: true })
  contractUntil!: number;

  @Column({ type: 'int', default: 0 })
  salary!: number;

  @Column({ type: 'int', default: 50 })
  ratingOVR!: number;

  @Column({ type: 'int', default: 50 })
  mechanics!: number;

  @Column({ type: 'int', default: 50 })
  macro!: number;

  @Column({ type: 'int', default: 50 })
  consistency!: number;

  @Column({ type: 'int', default: 50 })
  aggression!: number;

  @Column({ type: 'int', default: 50 })
  vision!: number;

  @Column({ type: 'int', default: 50 })
  objective!: number;

  @Column({ type: 'int', default: 50 })
  adaptability!: number;

  @Column({ type: 'int', default: 50 })
  clutch!: number;

  @Column({ type: 'int', default: 50 })
  potential!: number;

  @Column({ type: 'int', default: 50 })
  morale!: number;

  @Column({ type: 'int', default: 50 })
  form!: number;

  @Column({ type: 'int', default: 0 })
  marketValue!: number;

  constructor(partial?: Partial<Player>) {
    if (partial) Object.assign(this, partial);
  }
}
