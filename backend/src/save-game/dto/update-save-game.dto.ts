import { PartialType } from '@nestjs/swagger';
import { CreateSaveGameDto } from './create-save-game.dto';

export class UpdateSaveGameDto extends PartialType(CreateSaveGameDto) {}