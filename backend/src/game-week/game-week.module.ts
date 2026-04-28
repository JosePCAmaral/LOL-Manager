import { Module } from '@nestjs/common';
import { GameWeekService } from './game-week.service';
import { GameWeekController } from './game-week.controller';

@Module({
  controllers: [GameWeekController],
  providers: [GameWeekService],
  exports: [GameWeekService],
})
export class GameWeekModule {}
