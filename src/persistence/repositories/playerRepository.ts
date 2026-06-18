import { db } from '../db'
import type { Player } from '@types-app/index'

export const playerRepository = {
  async getAll(): Promise<Player[]> {
    return db.players.toArray()
  },

  async getById(id: string): Promise<Player | undefined> {
    return db.players.get(id)
  },

  async getByTeam(teamId: string): Promise<Player[]> {
    return db.players.where('teamId').equals(teamId).toArray()
  },

  async getByRole(role: string): Promise<Player[]> {
    return db.players.where('role').equals(role).toArray()
  },

  async save(player: Player): Promise<void> {
    await db.players.put(player)
  },

  async saveMany(players: Player[]): Promise<void> {
    await db.players.bulkPut(players)
  },

  async delete(id: string): Promise<void> {
    await db.players.delete(id)
  },

  async deleteAll(): Promise<void> {
    await db.players.clear()
  },

  async count(): Promise<number> {
    return db.players.count()
  },
}
