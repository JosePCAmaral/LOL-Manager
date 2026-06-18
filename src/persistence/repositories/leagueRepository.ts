import { db } from '../db'
import type { League, Fixture, MatchResult, Champion } from '@types-app/index'
import type { StaffRecord } from '../db'

// ---- League ----

export const leagueRepository = {
  async getAll(): Promise<League[]> {
    return db.leagues.toArray()
  },

  async getById(id: string): Promise<League | undefined> {
    return db.leagues.get(id)
  },

  async save(league: League): Promise<void> {
    await db.leagues.put(league)
  },

  async saveMany(leagues: League[]): Promise<void> {
    await db.leagues.bulkPut(leagues)
  },

  async delete(id: string): Promise<void> {
    await db.leagues.delete(id)
  },

  async deleteAll(): Promise<void> {
    await db.leagues.clear()
  },
}

// ---- Fixture ----

export const fixtureRepository = {
  async getAll(): Promise<Fixture[]> {
    return db.fixtures.toArray()
  },

  async getById(id: string): Promise<Fixture | undefined> {
    return db.fixtures.get(id)
  },

  async getByLeague(leagueId: string): Promise<Fixture[]> {
    return db.fixtures.where('leagueId').equals(leagueId).toArray()
  },

  // Returns fixtures where the team appears as either teamA or teamB
  async getByTeam(teamId: string): Promise<Fixture[]> {
    const asA = await db.fixtures.where('teamA').equals(teamId).toArray()
    const asB = await db.fixtures.where('teamB').equals(teamId).toArray()
    return [...asA, ...asB]
  },

  async getUnplayed(leagueId: string): Promise<Fixture[]> {
    return db.fixtures
      .where('leagueId')
      .equals(leagueId)
      .filter(f => !f.played)
      .toArray()
  },

  async save(fixture: Fixture): Promise<void> {
    await db.fixtures.put(fixture)
  },

  async saveMany(fixtures: Fixture[]): Promise<void> {
    await db.fixtures.bulkPut(fixtures)
  },

  async deleteAll(): Promise<void> {
    await db.fixtures.clear()
  },
}

// ---- MatchResult ----

export const matchResultRepository = {
  async getAll(): Promise<MatchResult[]> {
    return db.matchResults.toArray()
  },

  async getById(id: string): Promise<MatchResult | undefined> {
    return db.matchResults.get(id)
  },

  async getByTeam(teamId: string): Promise<MatchResult[]> {
    const asA = await db.matchResults.where('teamA').equals(teamId).toArray()
    const asB = await db.matchResults.where('teamB').equals(teamId).toArray()
    return [...asA, ...asB]
  },

  async save(result: MatchResult): Promise<void> {
    await db.matchResults.put(result)
  },

  async saveMany(results: MatchResult[]): Promise<void> {
    await db.matchResults.bulkPut(results)
  },

  async deleteAll(): Promise<void> {
    await db.matchResults.clear()
  },
}

// ---- Staff ----
// StaffMember has no teamId on the base type; we use StaffRecord (which adds teamId)
// for storage so we can query by team.

export const staffRepository = {
  async getAll(): Promise<StaffRecord[]> {
    return db.staff.toArray()
  },

  async getByTeam(teamId: string): Promise<StaffRecord[]> {
    return db.staff.where('teamId').equals(teamId).toArray()
  },

  async save(record: StaffRecord): Promise<void> {
    await db.staff.put(record)
  },

  async saveMany(records: StaffRecord[]): Promise<void> {
    await db.staff.bulkPut(records)
  },

  async deleteAll(): Promise<void> {
    await db.staff.clear()
  },
}

// ---- Champion ----

export const championRepository = {
  async getAll(): Promise<Champion[]> {
    return db.champions.toArray()
  },

  async getById(id: string): Promise<Champion | undefined> {
    return db.champions.get(id)
  },

  async save(champion: Champion): Promise<void> {
    await db.champions.put(champion)
  },

  async saveMany(champions: Champion[]): Promise<void> {
    await db.champions.bulkPut(champions)
  },

  async deleteAll(): Promise<void> {
    await db.champions.clear()
  },
}
