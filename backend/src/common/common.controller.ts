import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';

@ApiTags('common')
@Controller('common')
export class CommonController {
  constructor(private readonly svc: CommonService) {}

  @Get('enums')
  @ApiOperation({ summary: 'Listar enums disponíveis para regras e calendário' })
  @ApiOkResponse({ description: 'Retorna listas de valores possíveis para enums do domínio.' })
  getEnums() {
    return this.svc.getEnums();
  }
}
