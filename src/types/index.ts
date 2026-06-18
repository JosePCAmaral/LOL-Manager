// Shared types across all layers — no logic here, only type definitions

import type { GameDate } from '../engine/core/gameDate'
export type { GameDate } from '../engine/core/gameDate'

export type Role = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'

export interface PlayerAttributes {
  mechanics: number       // 1-20
  laning: number
  teamfight: number
  gameSense: number
  shotcalling: number
  metaAdaptation: number
  consistency: number
  resilience: number
  synergy: number         // 0–100, grows with time played together (scrims/matches)
}

export interface ChampionMastery {
  championId: string
  masteryLevel: number    // 1-20
}

export type ScalingCurve = 'early' | 'mid' | 'late'

export interface Champion {
  id: string
  name: string
  eligibleRoles: Role[]
  damageType: 'physical' | 'magic' | 'mixed'
  range: number            // 0 (melee) to 2 (long range poke)
  earlyPower: number       // 0-2
  sustain: number          // 0-2
  mobility: number         // 0-2
  scalingCurve: ScalingCurve
  compTags: {
    engage: number         // 0-2
    peel: number           // 0-2
    waveClear: number      // 0-2
    ccChain: number        // 0-2
  }
}

export interface Contract {
  playerId: string
  teamId: string
  salary: number
  startDate: GameDate
  endDate: GameDate
  buyoutClause: number
}

export interface Player {
  id: string
  name: string
  role: Role
  age: number
  region: string
  attributes: PlayerAttributes
  championPool: ChampionMastery[]
  potential: number
  morale: number
  stamina: number
  burnoutRisk: number
  contract: Contract | null
  teamId: string | null
  isStarter: boolean
}

export interface StaffMember {
  id: string
  name: string
  role: 'COACH' | 'ANALYST' | 'PSYCHOLOGIST' | 'SCOUT'
  competence: number
  salary: number
}

export interface Team {
  id: string
  name: string
  logoAssetId: string
  leagueId: string
  region: string
  budget: number
  reputation: number
  fanbase: number
  roster: {
    starters: Partial<Record<Role, string>>
    reserves: Partial<Record<Role, string>>
  }
  staff: StaffMember[]
  facilityLevel: number
  weeklyRevenue?: number
  initialBudget?: number
}

export interface Fixture {
  id: string
  date: GameDate
  teamA: string
  teamB: string
  played: boolean
}

export interface StandingEntry {
  teamId: string
  wins: number
  losses: number
}

export type MatchEvent =
  | { type: 'kill'; time: number; killer: string; victim: string; assists: string[] }
  | { type: 'towerDestroyed'; time: number; team: string; lane: string }
  | { type: 'objective'; time: number; team: string; objective: string }
  | { type: 'itemPurchase'; time: number; player: string; item: string }
  | { type: 'goldUpdate'; time: number; teamGold: [number, number] }

export interface DraftResult {
  bans: Record<string, string[]>
  picks: Record<string, Record<Role, string>>
}

export interface MatchResult {
  id: string
  leagueId: string
  date: GameDate
  teamA: string
  teamB: string
  draft: DraftResult
  timeline: MatchEvent[]
  winner: string
}

export interface League {
  id: string
  name: string
  region: string
  tier: 1 | 2
  teamIds: string[]
  schedule: Fixture[]
  standings: StandingEntry[]
  phase: 'regularSeason' | 'playoffs' | 'offseason'
}

export interface ScoutingProspect {
  id: string
  name: string
  region: string
  estimatedRole: Role
  observedAttributes: Partial<PlayerAttributes>
  confidence: number       // 0-1
  trackedSince: GameDate
  // Extended fields used by the scouting engine module
  role?: Role
  age?: number
  estimatedRating?: number   // visible estimate before full scout
  trueRating?: number        // actual hidden rating
  potential?: number         // hidden until scouted
  scoutedBy?: string | null
  contractStatus?: 'free_agent' | 'contracted'
  salary?: number
  discovered?: boolean
}

export interface DataPackOverlay {
  id: string
  name: string
  teamsOverlay: { fictionalTeamId: string; realName: string; realLogoUrl: string }[]
  playersOverlay: { fictionalPlayerId: string; realName: string; realAttributesOverride?: Partial<PlayerAttributes> }[]
}

export interface SaveGameState {
  id: string
  currentDate: GameDate
  managedTeamId: string
  rngSeed: string
  leagues: League[]
  teams: Team[]
  players: Player[]
  scoutingProspects: ScoutingProspect[]
}
