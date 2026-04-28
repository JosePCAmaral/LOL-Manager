import { Module } from '@nestjs/common';
import { SaveGameService } from './save-game.service';
import { SaveGameController } from './save-game.controller';

@Module({
  controllers: [SaveGameController],
  providers: [SaveGameService],
  exports: [SaveGameService],
})
export class SaveGameModule {}
