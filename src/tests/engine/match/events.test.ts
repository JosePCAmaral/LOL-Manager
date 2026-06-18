/**
 * events.test.ts
 *
 * Validates events.ts against docs/simulacao_e_draft.md section 7.
 */

import { describe, it, expect } from 'vitest'
import {
  generateLaningEvents,
  generateMidGameEvents,
  generateTeamfightEvents,
  generateGoldUpdates,
} from '@engine/match/events'
import { seededRandom } from '@engine/core/rng'
import type { LaneResult } from '@engine/match/phases/laningPhase'
import type { MidGameResult } from '@engine/match/phases/midGamePhase'
import type { TeamfightResult } from '@engine/match/phases/teamfightPhase'
import type { Role } from '@types-app/index'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ROLES: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

function makeNeutralLaneResults(): LaneResult[] {
  return ROLES.map(role => ({
    role,
    blueScore: 10,
    redScore: 10,
    winner: 'draw' as const,
    goldDiff: 0,
  }))
}

function makeBlueWinLaneResults(margin = 5): LaneResult[] {
  return ROLES.map(role => ({
    role,
    blueScore: 10 + margin,
    redScore: 10,
    winner: 'blue' as const,
    goldDiff: margin * 15,
  }))
}

function makeNeutralMidResult(): MidGameResult {
  return {
    blueObjectives: 2,
    redObjectives: 2,
    blueGoldLead: 600,
    redGoldLead: 600,
    winner: 'draw',
    blueMacroScore: 10,
    redMacroScore: 10,
  }
}

function makeNeutralTeamfightResult(): TeamfightResult {
  return {
    blueWins: 3,
    redWins: 2,
    winner: 'blue',
    damageDealt: { blue: 1000, red: 800 },
    blueTeamfightScore: 12,
    redTeamfightScore: 10,
  }
}

// ---------------------------------------------------------------------------
// generateLaningEvents
// ---------------------------------------------------------------------------

describe('generateLaningEvents', () => {
  it('returns an array (can be empty when all lanes are draws)', () => {
    const lanes = makeNeutralLaneResults()
    const rng = seededRandom('laning-events-draw')
    const events = generateLaningEvents(lanes, 0, rng)
    expect(Array.isArray(events)).toBe(true)
  })

  it('lane with large margin win generates at least 1 event across 20 seeds', () => {
    // With a large margin (e.g. blueScore=18 vs redScore=5), killChance = min(0.9, 13/10) = 0.9
    // Almost certainly at least 1 event is generated across multiple seeds.
    const lanes: LaneResult[] = [
      { role: 'MID', blueScore: 18, redScore: 5, winner: 'blue', goldDiff: 195 },
      ...ROLES.filter(r => r !== 'MID').map(role => ({
        role, blueScore: 10, redScore: 10, winner: 'draw' as const, goldDiff: 0,
      })),
    ]

    let anyEventGenerated = false
    for (let i = 0; i < 20; i++) {
      const rng = seededRandom(`laning-margin-${i}`)
      const events = generateLaningEvents(lanes, 0, rng)
      if (events.length > 0) {
        anyEventGenerated = true
        break
      }
    }
    expect(anyEventGenerated).toBe(true)
  })

  it('all event times are between 0 and 22 (baseMinute=0, range up to +22)', () => {
    // randomMinute(baseMinute, 14, rng) → max = 0 + 14 = 13
    // randomMinute(baseMinute + 5, 9, rng) → max = 5 + 9 = 13
    // So all times should be within [0, 13] for baseMinute=0.
    const lanes = makeBlueWinLaneResults(8)
    const rng = seededRandom('laning-times')
    const events = generateLaningEvents(lanes, 0, rng)

    for (const event of events) {
      expect(event.time).toBeGreaterThanOrEqual(0)
      expect(event.time).toBeLessThanOrEqual(22)
    }
  })

  it('only generates kill or towerDestroyed event types', () => {
    const lanes = makeBlueWinLaneResults(8)
    const rng = seededRandom('laning-types')
    const events = generateLaningEvents(lanes, 0, rng)

    for (const event of events) {
      expect(['kill', 'towerDestroyed']).toContain(event.type)
    }
  })

  it('events are sorted by time ascending', () => {
    const lanes = makeBlueWinLaneResults(8)
    const rng = seededRandom('laning-sorted')
    const events = generateLaningEvents(lanes, 0, rng)

    for (let i = 1; i < events.length; i++) {
      expect(events[i].time).toBeGreaterThanOrEqual(events[i - 1].time)
    }
  })
})

// ---------------------------------------------------------------------------
// generateMidGameEvents
// ---------------------------------------------------------------------------

describe('generateMidGameEvents', () => {
  it('events have time >= baseMinute (15)', () => {
    const mid = makeNeutralMidResult()
    const rng = seededRandom('mid-events-time')
    const events = generateMidGameEvents(mid, 15, rng)

    for (const event of events) {
      expect(event.time).toBeGreaterThanOrEqual(15)
    }
  })

  it('only generates kill or objective event types', () => {
    const mid = makeNeutralMidResult()
    const rng = seededRandom('mid-events-types')
    const events = generateMidGameEvents(mid, 15, rng)

    for (const event of events) {
      expect(['kill', 'objective']).toContain(event.type)
    }
  })

  it('returns an array (may be empty for zero objectives)', () => {
    const midNoObjectives: MidGameResult = {
      blueObjectives: 0, redObjectives: 0,
      blueGoldLead: 0, redGoldLead: 0,
      winner: 'draw', blueMacroScore: 10, redMacroScore: 10,
    }
    const rng = seededRandom('mid-empty')
    const events = generateMidGameEvents(midNoObjectives, 15, rng)
    expect(Array.isArray(events)).toBe(true)
  })

  it('events sorted by time ascending', () => {
    const mid = makeNeutralMidResult()
    const rng = seededRandom('mid-sorted')
    const events = generateMidGameEvents(mid, 15, rng)

    for (let i = 1; i < events.length; i++) {
      expect(events[i].time).toBeGreaterThanOrEqual(events[i - 1].time)
    }
  })
})

// ---------------------------------------------------------------------------
// generateTeamfightEvents
// ---------------------------------------------------------------------------

describe('generateTeamfightEvents', () => {
  it('events have time >= baseMinute (25)', () => {
    const tf  = makeNeutralTeamfightResult()
    const rng = seededRandom('tf-events-time')
    const events = generateTeamfightEvents(tf, 25, rng)

    for (const event of events) {
      expect(event.time).toBeGreaterThanOrEqual(25)
    }
  })

  it('only generates kill or objective event types', () => {
    const tf  = makeNeutralTeamfightResult()
    const rng = seededRandom('tf-events-types')
    const events = generateTeamfightEvents(tf, 25, rng)

    for (const event of events) {
      expect(['kill', 'objective']).toContain(event.type)
    }
  })

  it('generates events when there are teamfight wins', () => {
    const tf: TeamfightResult = {
      blueWins: 3, redWins: 2,
      winner: 'blue',
      damageDealt: { blue: 1000, red: 800 },
      blueTeamfightScore: 12,
      redTeamfightScore: 10,
    }
    const rng = seededRandom('tf-has-events')
    const events = generateTeamfightEvents(tf, 25, rng)
    expect(events.length).toBeGreaterThan(0)
  })

  it('events sorted by time ascending', () => {
    const tf  = makeNeutralTeamfightResult()
    const rng = seededRandom('tf-sorted')
    const events = generateTeamfightEvents(tf, 25, rng)

    for (let i = 1; i < events.length; i++) {
      expect(events[i].time).toBeGreaterThanOrEqual(events[i - 1].time)
    }
  })
})

// ---------------------------------------------------------------------------
// generateGoldUpdates
// ---------------------------------------------------------------------------

describe('generateGoldUpdates', () => {
  it('returns goldUpdate events', () => {
    const lanes = makeNeutralLaneResults()
    const mid   = makeNeutralMidResult()
    const rng   = seededRandom('gold-updates')
    const events = generateGoldUpdates(lanes, mid, rng)

    expect(events.length).toBeGreaterThan(0)
    for (const event of events) {
      expect(event.type).toBe('goldUpdate')
    }
  })

  it('times are multiples of 5 (periodic 5-minute intervals)', () => {
    const lanes = makeNeutralLaneResults()
    const mid   = makeNeutralMidResult()
    const rng   = seededRandom('gold-multiples-5')
    const events = generateGoldUpdates(lanes, mid, rng)

    for (const event of events) {
      expect(event.time % 5).toBe(0)
    }
  })

  it('teamGold is a tuple [number, number] with both values >= 0', () => {
    const lanes = makeNeutralLaneResults()
    const mid   = makeNeutralMidResult()
    const rng   = seededRandom('gold-non-negative')
    const events = generateGoldUpdates(lanes, mid, rng)

    for (const event of events) {
      if (event.type === 'goldUpdate') {
        expect(Array.isArray(event.teamGold)).toBe(true)
        expect(event.teamGold).toHaveLength(2)
        expect(event.teamGold[0]).toBeGreaterThanOrEqual(0)
        expect(event.teamGold[1]).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('generates updates starting at minute 5 and up to at least minute 30', () => {
    const lanes = makeNeutralLaneResults()
    const mid   = makeNeutralMidResult()
    const rng   = seededRandom('gold-range')
    const events = generateGoldUpdates(lanes, mid, rng)

    const times = events.map(e => e.time)
    expect(Math.min(...times)).toBe(5)
    expect(Math.max(...times)).toBeGreaterThanOrEqual(30)
  })
})
