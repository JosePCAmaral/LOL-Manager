import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly repo: Repository<Player>,
  ) {}

  async findAll(): Promise<Player[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Player> {
    const it = await this.repo.findOneBy({ id });
    if (!it) throw new NotFoundException('Player not found');
    return it;
  }

  async create(dto: Partial<Player>): Promise<Player> {
    const ent = this.repo.create(dto as any);
    const saved = await this.repo.save(ent as any);
    return saved as Player;
  }

  async update(id: number, dto: Partial<Player>): Promise<Player> {
    const it = await this.findOne(id);
    Object.assign(it, dto);
    const saved = await this.repo.save(it as any);
    return saved as Player;
  }

  async remove(id: number): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Player not found');
  }
}
