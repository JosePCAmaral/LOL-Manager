import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SplitType } from '../common/enums/split-type.enum';
import { MatchStatus } from '../common/enums/match-status.enum';

@Entity('matches')
export class MatchEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  league_stage_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  teamA_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  teamB_id!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  winnerTeam_id?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  duration?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  playedAt?: string;

  @ApiProperty({ required: false })
  @Column({ default: false })
  isSimulated?: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  season?: number;

  @ApiProperty({ required: false, enum: SplitType })
  @Column({ type: 'enum', enum: SplitType, nullable: true })
  split?: SplitType;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  weekNumber?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  roundNumber?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  scheduledAt?: string;

  @ApiProperty({ required: false, enum: MatchStatus })
  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.SCHEDULED })
  status?: MatchStatus;

  constructor(partial?: Partial<MatchEntity>) {
    if (partial) Object.assign(this, partial);
  }
}
