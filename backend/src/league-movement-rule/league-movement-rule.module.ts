import { Module } from '@nestjs/common';
import { LeagueMovementRuleService } from './league-movement-rule.service';
import { LeagueMovementRuleController } from './league-movement-rule.controller';

@Module({
  controllers: [LeagueMovementRuleController],
  providers: [LeagueMovementRuleService],
  exports: [LeagueMovementRuleService],
})
export class LeagueMovementRuleModule {}
