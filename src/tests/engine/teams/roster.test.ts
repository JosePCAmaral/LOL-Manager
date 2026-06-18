import { describe, it, expect } from 'vitest'
import {
  addPlayerToRoster,
  removePlayerFromRoster,
  swapStarterReserve,
  getRosterSize,
} from '@engine/teams/roster'
import { makeTeam } from '../helpers'

describe('addPlayerToRoster', () => {
  it('asStarter=true: player appears in starters at the correct role', () => {
    const team = makeTeam({ roster: { starters: {}, reserves: {} } })
    const result = addPlayerToRoster(team, 'new-mid', 'MID', true)
    expect(result.roster.starters['MID']).toBe('new-mid')
  })

  it('asStarter=false: player appears in reserves at the correct role', () => {
    const team = makeTeam({ roster: { starters: {}, reserves: {} } })
    const result = addPlayerToRoster(team, 'reserve-top', 'TOP', false)
    expect(result.roster.reserves['TOP']).toBe('reserve-top')
  })

  it('does not affect the other section (starters vs reserves) when adding a starter', () => {
    const team = makeTeam({ roster: { starters: {}, reserves: { JUNGLE: 'existing-reserve' } } })
    const result = addPlayerToRoster(team, 'new-mid', 'MID', true)
    expect(result.roster.reserves['JUNGLE']).toBe('existing-reserve')
  })

  it('does not mutate the original team', () => {
    const team = makeTeam({ roster: { starters: {}, reserves: {} } })
    const clone = JSON.parse(JSON.stringify(team))
    addPlayerToRoster(team, 'p1', 'TOP', true)
    expect(team).toEqual(clone)
  })
})

describe('removePlayerFromRoster', () => {
  it('removes player from starters', () => {
    const team = makeTeam({
      roster: { starters: { TOP: 'p-top', MID: 'p-mid' }, reserves: {} },
    })
    const result = removePlayerFromRoster(team, 'p-top')
    expect(result.roster.starters['TOP']).toBeUndefined()
    expect(result.roster.starters['MID']).toBe('p-mid')
  })

  it('removes player from reserves', () => {
    const team = makeTeam({
      roster: { starters: {}, reserves: { JUNGLE: 'p-jungle-reserve' } },
    })
    const result = removePlayerFromRoster(team, 'p-jungle-reserve')
    expect(result.roster.reserves['JUNGLE']).toBeUndefined()
  })

  it('returns the same team reference when ID is not found', () => {
    const team = makeTeam()
    const result = removePlayerFromRoster(team, 'nonexistent-id')
    expect(result).toBe(team)
  })

  it('does not mutate the original team', () => {
    const team = makeTeam()
    const clone = JSON.parse(JSON.stringify(team))
    removePlayerFromRoster(team, 'p-top')
    expect(team).toEqual(clone)
  })
})

describe('swapStarterReserve', () => {
  it('swaps starter and reserve for the given role', () => {
    const team = makeTeam({
      roster: {
        starters: { MID: 'mid-starter' },
        reserves: { MID: 'mid-reserve' },
      },
    })
    const result = swapStarterReserve(team, 'MID')
    expect(result.roster.starters['MID']).toBe('mid-reserve')
    expect(result.roster.reserves['MID']).toBe('mid-starter')
  })

  it('returns the same team unchanged when no reserve exists for the role', () => {
    const team = makeTeam({
      roster: {
        starters: { TOP: 'top-starter' },
        reserves: {},
      },
    })
    const result = swapStarterReserve(team, 'TOP')
    expect(result).toBe(team)
  })

  it('when there is no current starter, promotes reserve and removes reserve slot', () => {
    const team = makeTeam({
      roster: {
        starters: {},
        reserves: { ADC: 'adc-reserve' },
      },
    })
    const result = swapStarterReserve(team, 'ADC')
    expect(result.roster.starters['ADC']).toBe('adc-reserve')
    expect(result.roster.reserves['ADC']).toBeUndefined()
  })

  it('does not mutate the original team', () => {
    const team = makeTeam({
      roster: {
        starters: { SUPPORT: 's1' },
        reserves: { SUPPORT: 's2' },
      },
    })
    const clone = JSON.parse(JSON.stringify(team))
    swapStarterReserve(team, 'SUPPORT')
    expect(team).toEqual(clone)
  })
})

describe('getRosterSize', () => {
  it('counts starters + reserves correctly', () => {
    const team = makeTeam({
      roster: {
        starters: { TOP: 'p1', MID: 'p2', JUNGLE: 'p3' },
        reserves: { ADC: 'p4', SUPPORT: 'p5' },
      },
    })
    expect(getRosterSize(team)).toBe(5)
  })

  it('returns 0 for an empty roster', () => {
    const team = makeTeam({ roster: { starters: {}, reserves: {} } })
    expect(getRosterSize(team)).toBe(0)
  })

  it('counts only starters when no reserves', () => {
    const team = makeTeam({
      roster: {
        starters: { TOP: 'p1', MID: 'p2' },
        reserves: {},
      },
    })
    expect(getRosterSize(team)).toBe(2)
  })

  it('counts only reserves when no starters', () => {
    const team = makeTeam({
      roster: {
        starters: {},
        reserves: { JUNGLE: 'p1', ADC: 'p2', SUPPORT: 'p3' },
      },
    })
    expect(getRosterSize(team)).toBe(3)
  })

  it('full roster of 5 starters + 5 reserves = 10', () => {
    const team = makeTeam({
      roster: {
        starters: { TOP: 'p1', JUNGLE: 'p2', MID: 'p3', ADC: 'p4', SUPPORT: 'p5' },
        reserves: { TOP: 'r1', JUNGLE: 'r2', MID: 'r3', ADC: 'r4', SUPPORT: 'r5' },
      },
    })
    expect(getRosterSize(team)).toBe(10)
  })
})
