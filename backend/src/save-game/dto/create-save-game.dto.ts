import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateSaveGameDto {
  @ApiProperty()
  @IsString()
  managerName!: string;

  @ApiProperty()
  @IsInt()
  current_team_id!: number;

  @ApiProperty()
  @IsInt()
  season!: number;

  @ApiProperty()
  @IsInt()
  split!: number;

  @ApiProperty()
  @IsString()
  difficulty!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}