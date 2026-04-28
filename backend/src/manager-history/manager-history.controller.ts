import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ManagerHistoryService } from './manager-history.service';
import { ManagerHistory } from './manager-history.entity';

@Controller('manager-history')
export class ManagerHistoryController {
  constructor(private readonly svc: ManagerHistoryService) {}

  @Get()
  findAll(): ManagerHistory[] {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: Partial<ManagerHistory>): ManagerHistory {
    return this.svc.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
