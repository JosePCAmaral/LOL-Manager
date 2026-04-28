import { PartialType } from '@nestjs/swagger';
import { CreateMatchDraftDto } from './create-match-draft.dto';

export class UpdateMatchDraftDto extends PartialType(CreateMatchDraftDto) {}