import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateMatchDto {
  @ApiProperty()
  @IsInt()
  league_stage_id!: number;

  @ApiProperty()
  @IsInt()
  teamA_id!: number;

  @ApiProperty()
  @IsInt()
  teamB_id!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  winnerTeam_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  playedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isSimulated?: boolean;
}