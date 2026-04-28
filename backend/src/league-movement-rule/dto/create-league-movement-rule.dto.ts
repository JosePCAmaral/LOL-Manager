import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MovementType } from '../../common/enums/movement-type.enum';
import { LeagueStageType } from '../../common/enums/league-stage-type.enum';

export class CreateLeagueMovementRuleDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  season!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  country_id!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  fromLeagueId!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  toLeagueId!: number;

  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  movementType!: MovementType;

  @ApiProperty()
  @IsInt()
  @Min(1)
  spots!: number;

  @ApiProperty({ required: false, enum: LeagueStageType })
  @IsOptional()
  @IsEnum(LeagueStageType)
  viaStageType?: LeagueStageType;
}
