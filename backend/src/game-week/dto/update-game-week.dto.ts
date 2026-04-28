import { PartialType } from '@nestjs/swagger';
import { CreateGameWeekDto } from './create-game-week.dto';

export class UpdateGameWeekDto extends PartialType(CreateGameWeekDto) {}
