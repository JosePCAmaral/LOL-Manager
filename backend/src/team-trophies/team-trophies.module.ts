import { Module } from '@nestjs/common';
import { TeamTrophiesService } from './team-trophies.service';
import { TeamTrophiesController } from './team-trophies.controller';

@Module({
  controllers: [TeamTrophiesController],
  providers: [TeamTrophiesService],
  exports: [TeamTrophiesService],
})
export class TeamTrophiesModule {}
