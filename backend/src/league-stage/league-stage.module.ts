import { Module } from '@nestjs/common';
import { LeagueStageService } from './league-stage.service';
import { LeagueStageController } from './league-stage.controller';

@Module({
  controllers: [LeagueStageController],
  providers: [LeagueStageService],
  exports: [LeagueStageService],
})
export class LeagueStageModule {}
