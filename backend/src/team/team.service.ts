import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly repo: Repository<Team>,
  ) {}

  async findAll(): Promise<Team[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Team> {
    const it = await this.repo.findOneBy({ id });
    if (!it) throw new NotFoundException('Team not found');
    return it;
  }

  async create(dto: Partial<Team>): Promise<Team> {
    const ent = this.repo.create(dto as any);
    const saved = await this.repo.save(ent as any);
    return saved as Team;
  }

  async update(id: number, dto: Partial<Team>): Promise<Team> {
    const it = await this.findOne(id);
    Object.assign(it, dto);
    const saved = await this.repo.save(it as any);
    return saved as Team;
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Team not found');
  }
}
