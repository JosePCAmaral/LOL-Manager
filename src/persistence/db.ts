import Dexie, { type Table } from 'dexie'
import type {
  Player,
  Team,
  League,
  Fixture,
  MatchResult,
  StaffMember,
  Champion,
} from '@types-app/index'

// SaveSlot — metadata displayed on the load screen
export interface SaveSlot {
  id: string           // 'save-1', 'save-2', 'save-3'
  name: string
  createdAt: number    // Date.now()
  updatedAt: number
  seasonYear: number
  dayOfYear: number
  managedTeamId: string
  teamName: string
  leagueName: string
  wins: number
  losses: number
}

// GameState — the active save's runtime state
export interface GameState {
  id: string              // always 'current' for the active save
  saveSlotId: string
  seasonYear: number
  dayOfYear: number
  managedTeamId: string
  rngSeed: string
  activeDatapackIds: string[]
  difficulty?: 'easy' | 'normal' | 'hard'
}

// StaffRecord — staff stored flat with a teamId for querying
export interface StaffRecord extends StaffMember {
  teamId: string
}

class LolManagerDB extends Dexie {
  players!: Table<Player>
  teams!: Table<Team>
  leagues!: Table<League>
  fixtures!: Table<Fixture>
  matchResults!: Table<MatchResult>
  staff!: Table<StaffRecord>
  champions!: Table<Champion>
  saveSlots!: Table<SaveSlot>
  gameState!: Table<GameState>

  constructor() {
    super('LolManagerDB')

    // Version 1 — initial schema
    // Dexie index syntax: primary key first, then indexed fields separated by commas.
    // Nested fields (e.g. date.year) are NOT supported as indices; use flat fields instead.
    // Fields that are only read (not filtered) don't need to be listed here.
    this.version(1).stores({
      players:      'id, teamId, role, region',
      teams:        'id, leagueId, region',
      leagues:      'id, region',
      // Fixture.date is a GameDate object — index teamA and teamB for getByTeam queries
      fixtures:     'id, leagueId, teamA, teamB, played',
      matchResults: 'id, leagueId, teamA, teamB',
      // StaffRecord has a flat teamId field added on top of StaffMember
      staff:        'id, teamId, role',
      champions:    'id',
      saveSlots:    'id',
      gameState:    'id',
    })

    // Version 2 — adds synergy to PlayerAttributes, weeklyRevenue/initialBudget to Team.
    // Indices are identical to v1; synergy lives inside player.attributes (not indexed).
    this.version(2).stores({
      players:      'id, teamId, role, region',
      teams:        'id, leagueId, region',
      leagues:      'id, region',
      fixtures:     'id, leagueId, teamA, teamB, played',
      matchResults: 'id, leagueId, teamA, teamB',
      staff:        'id, teamId, role',
      champions:    'id',
      saveSlots:    'id',
      gameState:    'id',
    }).upgrade(async tx => {
      // Migrate existing players: add synergy=0 if missing
      await tx.table('players').toCollection().modify((player: any) => {
        if (player.attributes && player.attributes.synergy === undefined) {
          player.attributes.synergy = 0
        }
      })
      // Migrate existing teams: add weeklyRevenue and initialBudget if missing
      await tx.table('teams').toCollection().modify((team: any) => {
        if (team.weeklyRevenue === undefined) team.weeklyRevenue = 0
        if (team.initialBudget === undefined) team.initialBudget = team.budget ?? 0
      })
    })

    // Version 3 — adds difficulty field to GameState
    this.version(3).stores({
      players:      'id, teamId, role, region',
      teams:        'id, leagueId, region',
      leagues:      'id, region',
      fixtures:     'id, leagueId, teamA, teamB, played',
      matchResults: 'id, leagueId, teamA, teamB',
      staff:        'id, teamId, role',
      champions:    'id',
      saveSlots:    'id',
      gameState:    'id',
    }).upgrade(async tx => {
      await tx.table('gameState').toCollection().modify((gs: any) => {
        if (gs.difficulty === undefined) gs.difficulty = 'normal'
      })
    })
  }
}

export const db = new LolManagerDB()
