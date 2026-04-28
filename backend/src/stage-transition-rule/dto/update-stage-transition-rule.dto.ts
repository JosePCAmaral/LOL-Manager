import { PartialType } from '@nestjs/swagger';
import { CreateStageTransitionRuleDto } from './create-stage-transition-rule.dto';

export class UpdateStageTransitionRuleDto extends PartialType(CreateStageTransitionRuleDto) {}
