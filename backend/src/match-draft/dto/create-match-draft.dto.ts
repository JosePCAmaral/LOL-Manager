import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateMatchDraftDto {
  @ApiProperty()
  @IsInt()
  match_id!: number;

  @ApiProperty()
  @IsInt()
  team_id!: number;

  @ApiProperty()
  @IsInt()
  championId!: number;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsInt()
  pickOrder!: number;
}