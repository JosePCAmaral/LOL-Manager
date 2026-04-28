import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LeagueStageType } from '../common/enums/league-stage-type.enum';
import { LeagueStageFormat } from '../common/enums/league-stage-format.enum';

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

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  // season removed: LeagueStage is treated as a template (no season/split)

  // split removed: use per-season instances if necessary

  @ApiProperty({ required: false, enum: LeagueStageType })
  @Column({ type: 'enum', enum: LeagueStageType, nullable: true })
  stageType?: LeagueStageType;

  @ApiProperty({ required: false, enum: LeagueStageFormat })
  @Column({ type: 'enum', enum: LeagueStageFormat, nullable: true })
  format?: LeagueStageFormat;

  @ApiProperty({ description: 'Semana de início da fase (inteiro, obrigatório para templates)' })
  @Column({ type: 'int' })
  startWeek!: number;

  @ApiProperty({ description: 'Semana de término da fase (inteiro, obrigatório para templates)' })
  @Column({ type: 'int' })
  endWeek!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  orderIndex?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 3 })
  pointsWin?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  pointsLoss?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  advancesCount?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  relegatesCount?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  sourceStageId?: number;

  constructor(partial?: Partial<LeagueStage>) {
    if (partial) Object.assign(this, partial);
  }
}
