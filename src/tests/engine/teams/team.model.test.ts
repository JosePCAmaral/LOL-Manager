import { describe, it, expect } from 'vitest'
import { getTeamStrength, canSignPlayer, getStarterIds } from '@engine/teams/team.model'
import { makeTeam, makePlayer } from '../helpers'

describe('getTeamStrength', () => {
  it('returns 1 (safe floor) when no starters are found in the players array', () => {
    const team = makeTeam()
    // Pass an empty players array — none of the starter IDs resolve
    expect(getTeamStrength(team, [])).toBe(1)
  })

  it('returns ~15 when all 5 starters have overall ≈ 15', () => {
    // All attributes = 15 → overall = 15
    const attrs = { mechanics: 15, laning: 15, teamfight: 15, gameSense: 15, shotcalling: 15, metaAdaptation: 15, consistency: 15, resilience: 15 }
    const players = (
      [
        { id: 'p-top', role: 'TOP' },
        { id: 'p-jungle', role: 'JUNGLE' },
        { id: 'p-mid', role: 'MID' },
        { id: 'p-adc', role: 'ADC' },
        { id: 'p-support', role: 'SUPPORT' },
      ] as const
    ).map(({ id, role }) => makePlayer({ id, role, attributes: attrs }))

    const team = makeTeam()
    expect(getTeamStrength(team, players)).toBeCloseTo(15)
  })

  it('skips starters whose IDs are not in the players list', () => {
    const team = makeTeam({
      roster: {
        starters: { TOP: 'p-top', JUNGLE: 'unknown-id' },
        reserves: {},
      },
    })
    const players = [makePlayer({ id: 'p-top', role: 'TOP', attributes: { mechanics: 10, laning: 10, teamfight: 10, gameSense: 10, shotcalling: 10, metaAdaptation: 10, consistency: 10, resilience: 10 } })]
    const strength = getTeamStrength(team, players)
    // Only p-top found, its overall is 10
    expect(strength).toBeCloseTo(10)
  })

  it('does not mutate the team or players', () => {
    const team = makeTeam()
    const players = [makePlayer()]
    const teamClone = JSON.parse(JSON.stringify(team))
    getTeamStrength(team, players)
    expect(team).toEqual(teamClone)
  })
})

describe('canSignPlayer', () => {
  it('returns false when salary exceeds budget', () => {
    const team = makeTeam({ budget: 10_000 })
    expect(canSignPlayer(team, 15_000)).toBe(false)
  })

  it('returns true when salary equals budget (exactly 0 remaining)', () => {
    const team = makeTeam({ budget: 10_000 })
    expect(canSignPlayer(team, 10_000)).toBe(true)
  })

  it('returns true when salary is less than budget', () => {
    const team = makeTeam({ budget: 10_000 })
    expect(canSignPlayer(team, 5_000)).toBe(true)
  })

  it('returns true when salary is 0', () => {
    const team = makeTeam({ budget: 10_000 })
    expect(canSignPlayer(team, 0)).toBe(true)
  })
})

describe('getStarterIds', () => {
  it('returns exactly the 5 starter IDs from a full roster', () => {
    const team = makeTeam()
    const ids = getStarterIds(team)
    expect(ids).toHaveLength(5)
    expect(ids).toContain('p-top')
    expect(ids).toContain('p-jungle')
    expect(ids).toContain('p-mid')
    expect(ids).toContain('p-adc')
    expect(ids).toContain('p-support')
  })

  it('returns empty array when roster has no starters', () => {
    const team = makeTeam({ roster: { starters: {}, reserves: {} } })
    expect(getStarterIds(team)).toHaveLength(0)
  })

  it('returns only filled slots (partial roster)', () => {
    const team = makeTeam({
      roster: { starters: { TOP: 'p-top', MID: 'p-mid' }, reserves: {} },
    })
    const ids = getStarterIds(team)
    expect(ids).toHaveLength(2)
    expect(ids).toContain('p-top')
    expect(ids).toContain('p-mid')
  })

  it('does not include reserve IDs', () => {
    const team = makeTeam({
      roster: {
        starters: { TOP: 'p-top' },
        reserves: { JUNGLE: 'p-jungle-reserve' },
      },
    })
    const ids = getStarterIds(team)
    expect(ids).not.toContain('p-jungle-reserve')
  })
})
