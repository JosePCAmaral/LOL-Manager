import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateLeagueDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  country_id!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  tier?: number;
}
