import { db } from '../db'
import type { Team } from '@types-app/index'

export const teamRepository = {
  async getAll(): Promise<Team[]> {
    return db.teams.toArray()
  },

  async getById(id: string): Promise<Team | undefined> {
    return db.teams.get(id)
  },

  async getByLeague(leagueId: string): Promise<Team[]> {
    return db.teams.where('leagueId').equals(leagueId).toArray()
  },

  async save(team: Team): Promise<void> {
    await db.teams.put(team)
  },

  async saveMany(teams: Team[]): Promise<void> {
    await db.teams.bulkPut(teams)
  },

  async delete(id: string): Promise<void> {
    await db.teams.delete(id)
  },

  async deleteAll(): Promise<void> {
    await db.teams.clear()
  },

  async count(): Promise<number> {
    return db.teams.count()
  },
}
