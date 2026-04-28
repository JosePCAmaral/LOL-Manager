import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { SimulationEngineModule } from '../simulation-engine/simulation-engine.module';

@Module({
  imports: [SimulationEngineModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
