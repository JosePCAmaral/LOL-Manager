import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { MatchDraftService } from './match-draft.service';
import { MatchDraft } from './match-draft.entity';

@Controller('match-drafts')
export class MatchDraftController {
  constructor(private readonly svc: MatchDraftService) {}

  @Get()
  findAll(): MatchDraft[] {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: Partial<MatchDraft>): MatchDraft {
    return this.svc.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(Number(id));
  }
}
