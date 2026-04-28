import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { SplitType } from '../common/enums/split-type.enum';

class GenerateWeeksRequest {
  season!: number;
  split!: SplitType;
  totalWeeks!: number;
  startDateISO!: string;
}

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly svc: CalendarService) {}

  @Post('generate-weeks')
  @ApiOperation({ summary: 'Gerar semanas de calendário da temporada' })
  @ApiBody({ type: GenerateWeeksRequest })
  @ApiOkResponse({ description: 'Semanas geradas com sucesso.' })
  generateWeeks(@Body() body: GenerateWeeksRequest) {
    return this.svc.generateSeasonWeeks(body.season, body.split, body.totalWeeks, body.startDateISO);
  }
}
