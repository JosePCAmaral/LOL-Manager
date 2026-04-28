import { Module } from '@nestjs/common';
import { MatchDraftService } from './match-draft.service';
import { MatchDraftController } from './match-draft.controller';

@Module({
  controllers: [MatchDraftController],
  providers: [MatchDraftService],
  exports: [MatchDraftService],
})
export class MatchDraftModule {}
