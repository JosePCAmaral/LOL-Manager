import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateTeamTrophyDto {
  @ApiProperty()
  @IsInt()
  team_id!: number;

  @ApiProperty()
  @IsInt()
  league_id!: number;

  @ApiProperty()
  @IsInt()
  titles!: number;
}