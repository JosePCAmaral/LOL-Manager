import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('league_stages')
export class LeagueStage {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  league_id!: number;

  @ApiProperty()
  @Column()
  name!: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  type?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  numbTeams?: number;

  constructor(partial?: Partial<LeagueStage>) {
    if (partial) Object.assign(this, partial);
  }
}
