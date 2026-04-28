import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('leagues')
export class League {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  name!: string;

  @ApiProperty()
  @Column()
  country_id!: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  tier?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  reputation?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true, type: 'int' })
  financialPower?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  code?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  region?: string;

  @ApiProperty({ required: false })
  @Column({ type: 'int', nullable: true })
  totalTeams?: number;

  @ApiProperty({ required: false })
  @Column({ default: true })
  isActive?: boolean;

  constructor(partial?: Partial<League>) {
    if (partial) Object.assign(this, partial);
  }
}
