import { Injectable, NotFoundException } from '@nestjs/common';
import { ManagerHistory } from './manager-history.entity';

@Injectable()
export class ManagerHistoryService {
  private items = new Map<number, ManagerHistory>();
  private nextId = 1;

  findAll(): ManagerHistory[] {
    return Array.from(this.items.values());
  }

  findOne(id: number): ManagerHistory {
    const it = this.items.get(id);
    if (!it) throw new NotFoundException('ManagerHistory not found');
    return it;
  }

  create(dto: Partial<ManagerHistory>): ManagerHistory {
    const id = this.nextId++;
    const ent = new ManagerHistory({ id, ...dto });
    this.items.set(id, ent);
    return ent;
  }

  remove(id: number): void {
    this.findOne(id);
    this.items.delete(id);
  }
}
