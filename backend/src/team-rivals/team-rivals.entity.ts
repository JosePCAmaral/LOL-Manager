import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('team_rivals')
export class TeamRival {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  team_id_1!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  team_id_2!: number;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  intensity!: number;

  constructor(partial?: Partial<TeamRival>) {
    if (partial) Object.assign(this, partial);
  }
}
