import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TransitionConditionType } from '../common/enums/transition-condition-type.enum';

@Entity('stage_transition_rules')
export class StageTransitionRule {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  fromStageId!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  toStageId!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  rankFrom!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  rankTo!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  targetSeedStart?: number;

  @ApiProperty({ enum: TransitionConditionType })
  @Column({ type: 'enum', enum: TransitionConditionType, default: TransitionConditionType.DIRECT })
  conditionType!: TransitionConditionType;

  constructor(partial?: Partial<StageTransitionRule>) {
    if (partial) Object.assign(this, partial);
  }
}
