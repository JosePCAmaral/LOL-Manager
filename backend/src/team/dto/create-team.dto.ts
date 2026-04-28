import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  country_id!: number;

  @ApiProperty()
  @IsInt()
  league_id!: number;

  @ApiProperty()
  @IsInt()
  coachLevel!: number;

  @ApiProperty()
  @IsInt()
  infrastructureLevel!: number;

  @ApiProperty()
  @IsInt()
  synergy!: number;

  @ApiProperty()
  @IsInt()
  reputation!: number;

  @ApiProperty()
  @IsInt()
  budget!: number;

  @ApiProperty()
  @IsInt()
  transferBudget!: number;

  @ApiProperty()
  @IsInt()
  salaryBudget!: number;

  @ApiProperty()
  @IsInt()
  earlyGame!: number;

  @ApiProperty()
  @IsInt()
  midGame!: number;

  @ApiProperty()
  @IsInt()
  lateGame!: number;

  @ApiProperty()
  @IsInt()
  teamFight!: number;

  @ApiProperty()
  @IsInt()
  objectiveControl!: number;

  @ApiProperty()
  @IsInt()
  visionControl!: number;

  @ApiProperty()
  @IsInt()
  tempoControl!: number;
}