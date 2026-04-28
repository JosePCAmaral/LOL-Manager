import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('team_trophies')
export class TeamTrophy {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  team_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  league_id!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  titles!: number;

  constructor(partial?: Partial<TeamTrophy>) {
    if (partial) Object.assign(this, partial);
  }
}
