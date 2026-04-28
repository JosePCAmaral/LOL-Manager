import { PartialType } from '@nestjs/mapped-types';
import { CreateLeagueStageDto } from './create-league-stage.dto';

export class UpdateLeagueStageDto extends PartialType(CreateLeagueStageDto) {}
