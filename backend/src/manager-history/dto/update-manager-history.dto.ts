import { PartialType } from '@nestjs/swagger';
import { CreateManagerHistoryDto } from './create-manager-history.dto';

export class UpdateManagerHistoryDto extends PartialType(CreateManagerHistoryDto) {}