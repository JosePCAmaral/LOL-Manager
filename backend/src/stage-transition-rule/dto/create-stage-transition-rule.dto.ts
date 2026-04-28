import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { TransitionConditionType } from '../../common/enums/transition-condition-type.enum';

export class CreateStageTransitionRuleDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  fromStageId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  toStageId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  rankFrom!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  rankTo!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetSeedStart?: number;

  @ApiProperty({ enum: TransitionConditionType, required: false })
  @IsOptional()
  @IsEnum(TransitionConditionType)
  conditionType?: TransitionConditionType;
}
