import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreatePlayerDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  team_id!: number;

  @ApiProperty()
  @IsInt()
  country_id!: number;

  @ApiProperty()
  @IsString()
  position!: string;

  @ApiProperty()
  @IsInt()
  age!: number;

  @ApiProperty()
  @IsInt()
  contractUntil!: number;

  @ApiProperty()
  @IsInt()
  salary!: number;

  @ApiProperty()
  @IsInt()
  ratingOVR!: number;

  @ApiProperty()
  @IsInt()
  mechanics!: number;

  @ApiProperty()
  @IsInt()
  macro!: number;

  @ApiProperty()
  @IsInt()
  consistency!: number;

  @ApiProperty()
  @IsInt()
  aggression!: number;

  @ApiProperty()
  @IsInt()
  vision!: number;

  @ApiProperty()
  @IsInt()
  objective!: number;

  @ApiProperty()
  @IsInt()
  adaptability!: number;

  @ApiProperty()
  @IsInt()
  clutch!: number;

  @ApiProperty()
  @IsInt()
  potential!: number;

  @ApiProperty()
  @IsInt()
  morale!: number;

  @ApiProperty()
  @IsInt()
  form!: number;

  @ApiProperty()
  @IsInt()
  marketValue!: number;
}