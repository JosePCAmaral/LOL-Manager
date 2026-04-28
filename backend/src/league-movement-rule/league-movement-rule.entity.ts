import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MovementType } from '../common/enums/movement-type.enum';
import { LeagueStageType } from '../common/enums/league-stage-type.enum';

@Entity('league_movement_rules')
export class LeagueMovementRule {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  season!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  country_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  fromLeagueId!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  toLeagueId!: number;

  @ApiProperty({ enum: MovementType })
  @Column({ type: 'enum', enum: MovementType })
  movementType!: MovementType;

  @ApiProperty()
  @Column({ type: 'int' })
  spots!: number;

  @ApiProperty({ required: false, enum: LeagueStageType })
  @Column({ type: 'enum', enum: LeagueStageType, nullable: true })
  viaStageType?: LeagueStageType;

  constructor(partial?: Partial<LeagueMovementRule>) {
    if (partial) Object.assign(this, partial);
  }
}
