import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { SplitType } from '../../common/enums/split-type.enum';

export class CreateGameWeekDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  season!: number;

  @ApiProperty({ enum: SplitType })
  @IsEnum(SplitType)
  split!: SplitType;

  @ApiProperty()
  @IsInt()
  @Min(1)
  weekNumber!: number;

  @ApiProperty()
  @IsString()
  startsAt!: string;

  @ApiProperty()
  @IsString()
  endsAt!: string;
}
