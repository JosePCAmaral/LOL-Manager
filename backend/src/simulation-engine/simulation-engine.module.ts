import { Module } from '@nestjs/common';
import { SimulationEngineService } from './simulation-engine.service';

@Module({
  providers: [SimulationEngineService],
  exports: [SimulationEngineService],
})
export class SimulationEngineModule {}
