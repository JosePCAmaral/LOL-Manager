import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateTeamRivalDto {
  @ApiProperty()
  @IsInt()
  team_id_1!: number;

  @ApiProperty()
  @IsInt()
  team_id_2!: number;

  @ApiProperty()
  @IsInt()
  intensity!: number;
}