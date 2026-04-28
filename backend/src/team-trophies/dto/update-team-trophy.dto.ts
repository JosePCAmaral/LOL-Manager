import { PartialType } from '@nestjs/swagger';
import { CreateTeamTrophyDto } from './create-team-trophy.dto';

export class UpdateTeamTrophyDto extends PartialType(CreateTeamTrophyDto) {}