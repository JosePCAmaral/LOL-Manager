import { Module } from '@nestjs/common';
import { MatchEventService } from './match-event.service';
import { MatchEventController } from './match-event.controller';

@Module({
  controllers: [MatchEventController],
  providers: [MatchEventService],
  exports: [MatchEventService],
})
export class MatchEventModule {}
