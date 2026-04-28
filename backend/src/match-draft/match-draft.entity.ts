import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('match_drafts')
export class MatchDraft {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  match_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  team_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  championId!: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  type!: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  pickOrder!: number;

  constructor(partial?: Partial<MatchDraft>) {
    if (partial) Object.assign(this, partial);
  }
}
