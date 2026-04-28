import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('manager_histories')
export class ManagerHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  save_id!: number;

  @ApiProperty()
  @Column({ type: 'int' })
  team_id!: number;

  @ApiProperty()
  @Column()
  startDate!: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  endDate?: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', default: 0 })
  titlesWon!: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  reasonLeft!: string;

  constructor(partial?: Partial<ManagerHistory>) {
    if (partial) Object.assign(this, partial);
  }
}
