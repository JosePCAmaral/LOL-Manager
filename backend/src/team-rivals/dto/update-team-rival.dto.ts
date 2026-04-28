import { PartialType } from '@nestjs/swagger';
import { CreateTeamRivalDto } from './create-team-rival.dto';

export class UpdateTeamRivalDto extends PartialType(CreateTeamRivalDto) {}