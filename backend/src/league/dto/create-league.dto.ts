import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLeagueDto {
  @ApiProperty({ description: 'Nome da liga, por exemplo: CBLOL Academy' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'ID do país ao qual a liga pertence' })
  @IsInt()
  @Min(1)
  country_id!: number;

  @ApiPropertyOptional({ description: 'Tier da liga dentro do país. Ex: 1, 2, 3.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  tier?: number;

  @ApiPropertyOptional({ description: 'Nome curto ou código da liga. Ex: BR1, BR2' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Região lógica para agrupamento. Ex: Brasil, Europa, NA' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Quantidade total de times previstos para essa liga' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalTeams?: number;

  @ApiPropertyOptional({ description: 'Liga está ativa e pode ser usada na criação de carreira?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Peso reputacional da liga para seleção e progressão' })
  @IsOptional()
  @IsInt()
  reputation?: number;

  @ApiPropertyOptional({ description: 'Poder financeiro médio da liga' })
  @IsOptional()
  @IsInt()
  financialPower?: number;
}
