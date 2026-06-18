import { describe, it, expect } from 'vitest'
import {
  generateScoutReport,
  rankProspects,
} from '@engine/scouting/scoutReport'
import { seededRandom } from '@engine/core/rng'
import { makePlayer, makeTeam } from '../helpers'
import type { ScoutingProspect, Role } from '@types-app/index'

function makeProspect(overrides: Partial<ScoutingProspect> = {}): ScoutingProspect {
  return {
    id: 'prospect-001',
    name: 'Test Prospect',
    region: 'BR',
    estimatedRole: 'MID' as Role,
    observedAttributes: {},
    confidence: 0,
    trackedSince: { year: 1, dayOfYear: 1 },
    role: 'MID' as Role,
    age: 18,
    estimatedRating: 10.0,
    trueRating: 10.0,
    potential: 75,
    scoutedBy: null,
    contractStatus: 'free_agent',
    salary: 0,
    discovered: false,
    ...overrides,
  }
}

const currentDate = { year: 1, dayOfYear: 50 }

describe('generateScoutReport', () => {
  it('returns a ScoutReport with all required fields', () => {
    const prospect = makeProspect()
    const team = makeTeam()
    const rng = seededRandom('report-fields')
    const report = generateScoutReport(prospect, team, [], 0.5, currentDate, rng)

    expect(report.prospectId).toBe(prospect.id)
    expect(report.teamId).toBe(team.id)
    expect(report.scoutedOn).toEqual(currentDate)
    expect(typeof report.estimatedRating).toBe('number')
    expect(typeof report.estimatedPotential).toBe('number')
    expect(typeof report.roleFit).toBe('number')
    expect(['sign', 'monitor', 'pass']).toContain(report.recommendation)
    expect(Array.isArray(report.notes)).toBe(true)
  })

  it('prospect without a starter in its role → roleFit >= 0.9', () => {
    const prospect = makeProspect({ role: 'TOP' })
    // Team with no TOP starter
    const team = makeTeam({
      roster: {
        starters: { JUNGLE: 'p-jungle', MID: 'p-mid', ADC: 'p-adc', SUPPORT: 'p-support' },
        reserves: {},
      },
    })
    const rng = seededRandom('report-rolefit')
    const report = generateScoutReport(prospect, team, [], 0.5, currentDate, rng)
    expect(report.roleFit).toBeGreaterThanOrEqual(0.9)
  })

  it('trueRating > 12 and roleFit > 0.5 → recommendation === sign', () => {
    const prospect = makeProspect({ role: 'TOP', trueRating: 15 })
    // No TOP starter so roleFit = 1.0
    const team = makeTeam({
      roster: {
        starters: { JUNGLE: 'p-jungle', MID: 'p-mid', ADC: 'p-adc', SUPPORT: 'p-support' },
        reserves: {},
      },
    })
    const rng = seededRandom('report-sign')
    const report = generateScoutReport(prospect, team, [], 0.5, currentDate, rng)
    expect(report.recommendation).toBe('sign')
  })

  it('trueRating < 7 and roleFit < 0.4 → recommendation === pass', () => {
    // Place a high-rated starter in the prospect's role so roleFit = 0.3
    const prospect = makeProspect({ role: 'MID', trueRating: 5.0 })
    const starter = makePlayer({
      id: 'mid-starter',
      role: 'MID',
      attributes: {
        mechanics: 15, laning: 15, teamfight: 15,
        gameSense: 15, shotcalling: 15, metaAdaptation: 15,
        consistency: 15, resilience: 15,
      },
    })
    const team = makeTeam({
      roster: {
        starters: { MID: 'mid-starter' },
        reserves: {},
      },
    })
    const rng = seededRandom('report-pass')
    const report = generateScoutReport(prospect, team, [starter], 0.5, currentDate, rng)
    expect(report.recommendation).toBe('pass')
  })

  it('estimatedPotential is between 40 and 100', () => {
    const prospect = makeProspect({ potential: 70 })
    const team = makeTeam()
    // Run several seeds to cover noise range
    for (let i = 0; i < 20; i++) {
      const rng = seededRandom(`report-potential-${i}`)
      const report = generateScoutReport(prospect, team, [], 0.5, currentDate, rng)
      expect(report.estimatedPotential).toBeGreaterThanOrEqual(40)
      expect(report.estimatedPotential).toBeLessThanOrEqual(100)
    }
  })

  it('starter found but low average rating → roleFit = 0.7', () => {
    const prospect = makeProspect({ role: 'ADC' })
    const lowStarter = makePlayer({
      id: 'adc-low',
      role: 'ADC',
      attributes: {
        mechanics: 5, laning: 5, teamfight: 5,
        gameSense: 5, shotcalling: 5, metaAdaptation: 5,
        consistency: 5, resilience: 5,
      },
    })
    const team = makeTeam({
      roster: {
        starters: { ADC: 'adc-low' },
        reserves: {},
      },
    })
    const rng = seededRandom('report-lowstarter')
    const report = generateScoutReport(prospect, team, [lowStarter], 0.5, currentDate, rng)
    expect(report.roleFit).toBe(0.7)
  })
})

describe('rankProspects', () => {
  it('empty array returns empty array', () => {
    const team = makeTeam()
    const result = rankProspects([], team, [])
    expect(result).toEqual([])
  })

  it('returns prospects sorted by trueRating descending', () => {
    const p1 = makeProspect({ id: 'p1', trueRating: 8 })
    const p2 = makeProspect({ id: 'p2', trueRating: 15 })
    const p3 = makeProspect({ id: 'p3', trueRating: 5 })
    const team = makeTeam()
    const result = rankProspects([p1, p2, p3], team, [])
    expect(result[0].trueRating).toBe(15)
    expect(result[1].trueRating).toBe(8)
    expect(result[2].trueRating).toBe(5)
  })

  it('does not mutate the original array', () => {
    const p1 = makeProspect({ id: 'p1', trueRating: 8 })
    const p2 = makeProspect({ id: 'p2', trueRating: 15 })
    const original = [p1, p2]
    const team = makeTeam()
    rankProspects(original, team, [])
    expect(original[0].id).toBe('p1')
    expect(original[1].id).toBe('p2')
  })

  it('single-element array remains unchanged', () => {
    const p = makeProspect({ id: 'solo', trueRating: 10 })
    const team = makeTeam()
    const result = rankProspects([p], team, [])
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('solo')
  })
})
