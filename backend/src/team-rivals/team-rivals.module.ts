import { Module } from '@nestjs/common';
import { TeamRivalsService } from './team-rivals.service';
import { TeamRivalsController } from './team-rivals.controller';

@Module({
  controllers: [TeamRivalsController],
  providers: [TeamRivalsService],
  exports: [TeamRivalsService],
})
export class TeamRivalsModule {}
