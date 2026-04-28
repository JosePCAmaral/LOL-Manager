import { PartialType } from '@nestjs/swagger';
import { CreateLeagueMovementRuleDto } from './create-league-movement-rule.dto';

export class UpdateLeagueMovementRuleDto extends PartialType(CreateLeagueMovementRuleDto) {}
