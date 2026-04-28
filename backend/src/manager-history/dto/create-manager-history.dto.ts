import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateManagerHistoryDto {
  @ApiProperty()
  @IsInt()
  save_id!: number;

  @ApiProperty()
  @IsInt()
  team_id!: number;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsInt()
  titlesWon!: number;

  @ApiProperty()
  @IsString()
  reasonLeft!: string;
}