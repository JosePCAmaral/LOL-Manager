import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('countries')
export class Country {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  name!: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  continentId?: number;

  constructor(partial?: Partial<Country>) {
    if (partial) Object.assign(this, partial);
  }
}
