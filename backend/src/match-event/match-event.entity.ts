import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('match_events')
export class MatchEvent {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  match_id!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  team_id!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  player_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  timestamp!: number;

  @ApiProperty()
  @Column()
  type!: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  positionX?: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  positionY?: number;

  @ApiProperty({ required: false, type: 'object' })
  @Column({ type: 'json', nullable: true })
  data?: any;

  constructor(partial?: Partial<MatchEvent>) {
    if (partial) Object.assign(this, partial);
  }
}
