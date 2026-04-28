import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SplitType } from '../common/enums/split-type.enum';
import { GameWeekStatus } from '../common/enums/game-week-status.enum';

@Entity('game_weeks')
export class GameWeek {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  season!: number;

  @ApiProperty({ enum: SplitType })
  @Column({ type: 'enum', enum: SplitType })
  split!: SplitType;

  @ApiProperty()
  @Column({ type: 'int' })
  weekNumber!: number;

  @ApiProperty()
  @Column()
  startsAt!: string;

  @ApiProperty()
  @Column()
  endsAt!: string;

  @ApiProperty({ enum: GameWeekStatus })
  @Column({ type: 'enum', enum: GameWeekStatus, default: GameWeekStatus.UPCOMING })
  status!: GameWeekStatus;

  constructor(partial?: Partial<GameWeek>) {
    if (partial) Object.assign(this, partial);
  }
}
