import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('match_player_stats')
export class MatchPlayerStats {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  match_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  player_id!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  kills!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  deaths!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  assists!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  cs!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  damage!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  visionScore!: number;

  constructor(partial?: Partial<MatchPlayerStats>) {
    if (partial) Object.assign(this, partial);
  }
}
