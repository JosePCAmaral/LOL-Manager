import { describe, it, expect } from 'vitest'
import {
  generateContractOffer,
  acceptContractOffer,
  terminateContract,
  isContractExpiringSoon,
} from '@engine/finance/contracts'
import { seededRandom } from '@engine/core/rng'
import { makePlayer, makeTeam } from '../helpers'

describe('generateContractOffer', () => {
  const rng = seededRandom('contract-gen')

  it('returns offer with weeklySalary > 0', () => {
    const player = makePlayer()
    const team = makeTeam()
    const offer = generateContractOffer(player, team, seededRandom('contract-salary'))
    expect(offer.weeklySalary).toBeGreaterThan(0)
  })

  it('durationWeeks is one of [26, 52, 78]', () => {
    const player = makePlayer()
    const team = makeTeam()
    for (let i = 0; i < 10; i++) {
      const offer = generateContractOffer(player, team, seededRandom(`contract-dur-${i}`))
      expect([26, 52, 78]).toContain(offer.durationWeeks)
    }
  })

  it('player with high overall rating (>= 12) gets signingBonus > 0', () => {
    // All attributes at 16 → rating > 12
    const player = makePlayer({
      attributes: {
        mechanics: 16, laning: 16, teamfight: 16, gameSense: 16,
        shotcalling: 16, metaAdaptation: 16, consistency: 16, resilience: 16,
      },
    })
    const team = makeTeam()
    const offer = generateContractOffer(player, team, seededRandom('contract-highrating'))
    expect(offer.signingBonus).toBeGreaterThan(0)
  })

  it('player with low overall rating (< 12) gets signingBonus === 0', () => {
    // All attributes at 5 → rating < 12
    const player = makePlayer({
      attributes: {
        mechanics: 5, laning: 5, teamfight: 5, gameSense: 5,
        shotcalling: 5, metaAdaptation: 5, consistency: 5, resilience: 5,
      },
    })
    const team = makeTeam()
    const offer = generateContractOffer(player, team, seededRandom('contract-lowrating'))
    expect(offer.signingBonus).toBe(0)
  })

  it('buyoutClause > weeklySalary', () => {
    const player = makePlayer()
    const team = makeTeam()
    const offer = generateContractOffer(player, team, rng)
    expect(offer.buyoutClause).toBeGreaterThan(offer.weeklySalary)
  })

  it('offer contains player and team ids', () => {
    const player = makePlayer({ id: 'player-test' })
    const team = makeTeam({ id: 'team-test' })
    const offer = generateContractOffer(player, team, seededRandom('contract-ids'))
    expect(offer.playerId).toBe('player-test')
    expect(offer.teamId).toBe('team-test')
  })
})

describe('acceptContractOffer', () => {
  it('returns player with contract !== null', () => {
    const player = makePlayer({ contract: null })
    const team = makeTeam()
    const offer = generateContractOffer(player, team, seededRandom('accept-1'))
    const result = acceptContractOffer(player, offer)
    expect(result.contract).not.toBeNull()
  })

  it('does not mutate the original player', () => {
    const player = makePlayer({ contract: null })
    const team = makeTeam()
    const offer = generateContractOffer(player, team, seededRandom('accept-immut'))
    const originalContract = player.contract
    acceptContractOffer(player, offer)
    expect(player.contract).toBe(originalContract)
  })

  it('result contract.salary equals offer.weeklySalary', () => {
    const player = makePlayer({ contract: null })
    const team = makeTeam()
    const offer = generateContractOffer(player, team, seededRandom('accept-salary'))
    const result = acceptContractOffer(player, offer)
    expect(result.contract!.salary).toBe(offer.weeklySalary)
  })

  it('result player.teamId equals offer.teamId', () => {
    const player = makePlayer({ teamId: null, contract: null })
    const team = makeTeam({ id: 'new-team' })
    const offer = generateContractOffer(player, team, seededRandom('accept-teamid'))
    const result = acceptContractOffer(player, offer)
    expect(result.teamId).toBe('new-team')
  })
})

describe('terminateContract', () => {
  it('earlyTermination=true → penaltyCost > 0', () => {
    const player = makePlayer()
    const team = makeTeam()
    const { penaltyCost } = terminateContract(player, team, true)
    expect(penaltyCost).toBeGreaterThan(0)
  })

  it('earlyTermination=true → team budget decreases', () => {
    const player = makePlayer()
    const team = makeTeam({ budget: 100_000 })
    const { team: result } = terminateContract(player, team, true)
    expect(result.budget).toBeLessThan(100_000)
  })

  it('earlyTermination=false → penaltyCost === 0', () => {
    const player = makePlayer()
    const team = makeTeam()
    const { penaltyCost } = terminateContract(player, team, false)
    expect(penaltyCost).toBe(0)
  })

  it('earlyTermination=false → team budget unchanged', () => {
    const player = makePlayer()
    const team = makeTeam({ budget: 100_000 })
    const { team: result } = terminateContract(player, team, false)
    expect(result.budget).toBe(100_000)
  })

  it('resulting player has contract === null', () => {
    const player = makePlayer()
    const team = makeTeam()
    const { player: result } = terminateContract(player, team, false)
    expect(result.contract).toBeNull()
  })

  it('does not mutate original player', () => {
    const player = makePlayer()
    const originalContract = player.contract
    const team = makeTeam()
    terminateContract(player, team, false)
    expect(player.contract).toBe(originalContract)
  })

  it('player with null contract and earlyTermination=true → penaltyCost = 0', () => {
    const player = makePlayer({ contract: null })
    const team = makeTeam({ budget: 100_000 })
    const { penaltyCost, team: result } = terminateContract(player, team, true)
    expect(penaltyCost).toBe(0)
    expect(result.budget).toBe(100_000)
  })
})

describe('isContractExpiringSoon', () => {
  it('player without contract → false', () => {
    const player = makePlayer({ contract: null })
    expect(isContractExpiringSoon(player, 1)).toBe(false)
  })

  it('contract expiring in less than 8 weeks → true', () => {
    // currentWeek=10, endDate = year 1, dayOfYear = 77 (11 weeks)
    // endTotalDays = 77, currentTotalDays = 10*7 = 70, diff = 7 days = 1 week < 8 weeks
    const player = makePlayer({
      contract: {
        playerId: 'p1',
        teamId: 'team1',
        salary: 5_000,
        startDate: { year: 1, dayOfYear: 1 },
        endDate: { year: 1, dayOfYear: 77 },
        buyoutClause: 10_000,
      },
    })
    expect(isContractExpiringSoon(player, 10)).toBe(true)
  })

  it('contract expiring in more than 8 weeks → false', () => {
    // currentWeek=1, endDate year=2 dayOfYear=1 → 365+1 = 366 total days
    // currentTotalDays=7, diff=359 days > 56 → false
    const player = makePlayer({
      contract: {
        playerId: 'p1',
        teamId: 'team1',
        salary: 5_000,
        startDate: { year: 1, dayOfYear: 1 },
        endDate: { year: 2, dayOfYear: 1 },
        buyoutClause: 10_000,
      },
    })
    expect(isContractExpiringSoon(player, 1)).toBe(false)
  })
})
