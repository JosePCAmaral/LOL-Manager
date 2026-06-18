/**
 * Shared test helpers — factory functions for Player, Team, StaffMember, Fixture.
 * Import these in any engine test file.
 */

import type { Player, Team, StaffMember, Fixture, Role, PlayerAttributes, Contract } from '@types-app/index'

// ---------------------------------------------------------------------------
// Attribute factory
// ---------------------------------------------------------------------------

function makeAttributes(overrides: Partial<PlayerAttributes> = {}): PlayerAttributes {
  return {
    mechanics: 10,
    laning: 10,
    teamfight: 10,
    gameSense: 10,
    shotcalling: 10,
    metaAdaptation: 10,
    consistency: 10,
    resilience: 10,
    synergy: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Contract factory
// ---------------------------------------------------------------------------

function makeContract(playerId = 'p1', teamId = 'team1'): Contract {
  return {
    playerId,
    teamId,
    salary: 5000,
    startDate: { year: 1, dayOfYear: 1 },
    endDate: { year: 2, dayOfYear: 1 },
    buyoutClause: 10000,
  }
}

// ---------------------------------------------------------------------------
// Player factory
// ---------------------------------------------------------------------------

export function makePlayer(overrides: Partial<Player> = {}): Player {
  const base: Player = {
    id: 'p1',
    name: 'Test Player',
    role: 'MID' as Role,
    age: 22,
    country: 'BR',
    attributes: makeAttributes(),
    championPool: [
      { championId: 'champ-a', masteryLevel: 10 },
      { championId: 'champ-b', masteryLevel: 5 },
    ],
    potential: 80,
    morale: 70,
    stamina: 80,
    burnoutRisk: 10,
    contract: makeContract(),
    teamId: 'team1',
    isStarter: true,
  }
  return { ...base, ...overrides }
}

// ---------------------------------------------------------------------------
// Staff factory
// ---------------------------------------------------------------------------

export function makeStaff(overrides: Partial<StaffMember> = {}): StaffMember {
  const base: StaffMember = {
    id: 's1',
    name: 'Head Coach',
    role: 'COACH',
    competence: 10,
    salary: 3000,
  }
  return { ...base, ...overrides }
}

// ---------------------------------------------------------------------------
// Team factory
// ---------------------------------------------------------------------------

export function makeTeam(overrides: Partial<Team> = {}): Team {
  const base: Team = {
    id: 'team1',
    name: 'Test Team',
    logoAssetId: 'logo-1',
    leagueId: 'league-1',
    countries: ['BR'],
    budget: 100_000,
    reputation: 50,
    fanbase: 1000,
    roster: {
      starters: {
        TOP: 'p-top',
        JUNGLE: 'p-jungle',
        MID: 'p-mid',
        ADC: 'p-adc',
        SUPPORT: 'p-support',
      },
      reserves: {},
    },
    staff: [makeStaff()],
    facilityLevel: 2,
  }
  return { ...base, ...overrides }
}

// ---------------------------------------------------------------------------
// Fixture factory
// ---------------------------------------------------------------------------

export function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  const base: Fixture = {
    id: 'fix-1-0000',
    date: { year: 1, dayOfYear: 15 },
    teamA: 'team1',
    teamB: 'team2',
    played: false,
  }
  return { ...base, ...overrides }
}
