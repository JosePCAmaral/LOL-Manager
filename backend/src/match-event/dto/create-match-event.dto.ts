import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateMatchEventDto {
  @ApiProperty()
  @IsInt()
  match_id!: number;

  @ApiProperty()
  @IsInt()
  team_id!: number;

  @ApiProperty()
  @IsInt()
  player_id!: number;

  @ApiProperty()
  @IsInt()
  timestamp!: number;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  positionX?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  positionY?: number;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}