import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('save_games')
export class SaveGame {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  managerName!: string;

  @ApiProperty()
  @Column({ type: 'int' })
  current_team_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  season!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  split!: number;

  @ApiProperty()
  @Column({ default: 'normal' })
  difficulty!: string;

  @ApiProperty()
  @Column()
  createdAt!: string;

  constructor(partial?: Partial<SaveGame>) {
    if (partial) Object.assign(this, partial);
  }
}
