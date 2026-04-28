import { Module } from '@nestjs/common';
import { StageTransitionRuleService } from './stage-transition-rule.service';
import { StageTransitionRuleController } from './stage-transition-rule.controller';

@Module({
  controllers: [StageTransitionRuleController],
  providers: [StageTransitionRuleService],
  exports: [StageTransitionRuleService],
})
export class StageTransitionRuleModule {}
