import { Module } from '@nestjs/common';
import { ManagerHistoryService } from './manager-history.service';
import { ManagerHistoryController } from './manager-history.controller';

@Module({
  controllers: [ManagerHistoryController],
  providers: [ManagerHistoryService],
  exports: [ManagerHistoryService],
})
export class ManagerHistoryModule {}
