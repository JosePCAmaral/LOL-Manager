import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LeagueStageType } from '../../common/enums/league-stage-type.enum';
import { LeagueStageFormat } from '../../common/enums/league-stage-format.enum';

export class CreateLeagueStageDto {
  @ApiProperty({ description: 'ID da liga pai' })
  @IsInt()
  @Min(1)
  league_id!: number;

  @ApiProperty({ description: 'Nome da fase. Ex: Fase Principal, Playoff, Rebaixamento' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Tipo textual legado da fase, se ainda quiser manter compatibilidade' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Quantidade de times previstos para essa fase' })
  @IsOptional()
  @IsInt()
  @Min(1)
  numbTeams?: number;


  @ApiPropertyOptional({ enum: LeagueStageType, description: 'Tipo da fase. Ex: REGULAR_SEASON, PLAY_IN, PLAYOFF' })
  @IsOptional()
  @IsEnum(LeagueStageType)
  stageType?: LeagueStageType;

  @ApiPropertyOptional({ enum: LeagueStageFormat, description: 'Formato da fase. Ex: ROUND_ROBIN_BO1, ROUND_ROBIN_BO3, DOUBLE_ELIMINATION_BO5' })
  @IsOptional()
  @IsEnum(LeagueStageFormat)
  format?: LeagueStageFormat;

  @ApiProperty({ description: 'Semana de início da fase' })
  @IsInt()
  @Min(1)
  startWeek!: number;

  @ApiProperty({ description: 'Semana de término da fase' })
  @IsInt()
  @Min(1)
  endWeek!: number;

  @ApiPropertyOptional({ description: 'Ordem da fase dentro da temporada ou do split' })
  @IsOptional()
  @IsInt()
  @Min(1)
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Pontos por vitória nessa fase' })
  @IsOptional()
  @IsInt()
  pointsWin?: number;

  @ApiPropertyOptional({ description: 'Pontos por derrota nessa fase' })
  @IsOptional()
  @IsInt()
  pointsLoss?: number;

  @ApiPropertyOptional({ description: 'Quantidade de times que avançam para a próxima fase' })
  @IsOptional()
  @IsInt()
  @Min(0)
  advancesCount?: number;

  @ApiPropertyOptional({ description: 'Quantidade de times que são rebaixados a partir dessa fase' })
  @IsOptional()
  @IsInt()
  @Min(0)
  relegatesCount?: number;

  @ApiPropertyOptional({ description: 'ID da fase de origem caso exista uma cadeia de classificação' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sourceStageId?: number;
}
