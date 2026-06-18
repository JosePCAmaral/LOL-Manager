import { describe, it, expect, beforeEach } from 'vitest'
import {
  canTrain,
  getTrainingRecommendation,
  applyGeneralTraining,
  applyChampionTraining,
  applyScrimTraining,
} from '@engine/training/training'
import { seededRandom } from '@engine/core/rng'
import { makePlayer, makeStaff } from '../helpers'

describe('canTrain', () => {
  it('returns true when stamina >= 10', () => {
    const player = makePlayer({ stamina: 50 })
    expect(canTrain(player)).toBe(true)
  })

  it('returns false when stamina < 10', () => {
    const player = makePlayer({ stamina: 9 })
    expect(canTrain(player)).toBe(false)
  })

  it('returns true when stamina is exactly 10 (boundary)', () => {
    const player = makePlayer({ stamina: 10 })
    expect(canTrain(player)).toBe(true)
  })

  it('returns false when stamina is 0', () => {
    const player = makePlayer({ stamina: 0 })
    expect(canTrain(player)).toBe(false)
  })
})

describe('getTrainingRecommendation', () => {
  it('returns rest when stamina < 20 (stamina=15)', () => {
    const player = makePlayer({ stamina: 15, morale: 70 })
    expect(getTrainingRecommendation(player)).toBe('rest')
  })

  it('returns scrim when stamina >= 20 and morale < 30', () => {
    const player = makePlayer({ stamina: 50, morale: 25 })
    expect(getTrainingRecommendation(player)).toBe('scrim')
  })

  it('returns champion_focus when stamina >= 20, morale >= 30, and a champion has masteryLevel < 10', () => {
    const player = makePlayer({
      stamina: 50,
      morale: 60,
      championPool: [
        { championId: 'champ-a', masteryLevel: 5 },
        { championId: 'champ-b', masteryLevel: 15 },
      ],
    })
    expect(getTrainingRecommendation(player)).toBe('champion_focus')
  })

  it('returns general when stamina >= 20, morale >= 30, and all champions have masteryLevel >= 10', () => {
    const player = makePlayer({
      stamina: 50,
      morale: 60,
      championPool: [
        { championId: 'champ-a', masteryLevel: 10 },
        { championId: 'champ-b', masteryLevel: 15 },
      ],
    })
    expect(getTrainingRecommendation(player)).toBe('general')
  })

  it('returns rest even when morale < 30 if stamina < 20 (stamina check is first)', () => {
    const player = makePlayer({ stamina: 15, morale: 25 })
    expect(getTrainingRecommendation(player)).toBe('rest')
  })
})

describe('applyGeneralTraining', () => {
  let rng: () => number

  beforeEach(() => {
    rng = seededRandom('test-general')
  })

  it('does not mutate the original player', () => {
    const player = makePlayer({ stamina: 80, morale: 70 })
    const originalStamina = player.stamina
    const staff = [makeStaff()]
    applyGeneralTraining(player, staff, rng)
    expect(player.stamina).toBe(originalStamina)
  })

  it('returns a new player with lower stamina (cost -10)', () => {
    const player = makePlayer({ stamina: 80 })
    const { player: result } = applyGeneralTraining(player, [makeStaff()], rng)
    expect(result.stamina).toBe(70)
  })

  it('applies morale penalty when stamina < 20', () => {
    const player = makePlayer({ stamina: 15, morale: 70 })
    const { player: result } = applyGeneralTraining(player, [makeStaff()], rng)
    expect(result.morale).toBeLessThan(70)
  })

  it('does not apply morale penalty when stamina >= 20', () => {
    const player = makePlayer({ stamina: 50, morale: 70 })
    const { player: result } = applyGeneralTraining(player, [makeStaff()], rng)
    expect(result.morale).toBe(70)
  })

  it('session.type is general', () => {
    const player = makePlayer({ stamina: 80 })
    const { session } = applyGeneralTraining(player, [makeStaff()], rng)
    expect(session.type).toBe('general')
  })

  it('session.staminaCost is positive', () => {
    const player = makePlayer({ stamina: 80 })
    const { session } = applyGeneralTraining(player, [makeStaff()], rng)
    expect(session.staminaCost).toBeGreaterThan(0)
  })

  it('stamina is clamped to 0 when initial stamina < staminaCost', () => {
    const player = makePlayer({ stamina: 5 })
    const { player: result } = applyGeneralTraining(player, [makeStaff()], rng)
    expect(result.stamina).toBe(0)
  })

  it('session.staminaCost is 10', () => {
    const player = makePlayer({ stamina: 80 })
    const { session } = applyGeneralTraining(player, [makeStaff()], rng)
    expect(session.staminaCost).toBe(10)
  })
})

describe('applyChampionTraining', () => {
  let rng: () => number

  beforeEach(() => {
    rng = seededRandom('test-champion')
  })

  it('does not mutate the original player', () => {
    const player = makePlayer({ stamina: 80, championPool: [] })
    const originalPool = [...player.championPool]
    applyChampionTraining(player, 'new-champ', [], [], rng)
    expect(player.championPool).toEqual(originalPool)
  })

  it('adds champion to pool with masteryLevel >= 1 if not present', () => {
    const player = makePlayer({ championPool: [] })
    const { player: result } = applyChampionTraining(player, 'new-champ', [], [], rng)
    const entry = result.championPool.find(c => c.championId === 'new-champ')
    expect(entry).toBeDefined()
    expect(entry!.masteryLevel).toBeGreaterThanOrEqual(1)
  })

  it('does not exceed masteryLevel 20 for champion at max', () => {
    // Use a rng that always returns < incrementProbability so increment is attempted
    const alwaysIncrement = () => 0
    const player = makePlayer({
      championPool: [{ championId: 'champ-a', masteryLevel: 20 }],
    })
    const { player: result } = applyChampionTraining(player, 'champ-a', [], [], alwaysIncrement)
    const entry = result.championPool.find(c => c.championId === 'champ-a')
    expect(entry!.masteryLevel).toBe(20)
  })

  it('session.type is champion_focus', () => {
    const player = makePlayer({ championPool: [] })
    const { session } = applyChampionTraining(player, 'new-champ', [], [], rng)
    expect(session.type).toBe('champion_focus')
  })

  it('session.championId matches the trained champion', () => {
    const player = makePlayer({ championPool: [] })
    const { session } = applyChampionTraining(player, 'new-champ', [], [], rng)
    expect(session.championId).toBe('new-champ')
  })

  it('stamina of result is lower than initial (cost -8)', () => {
    const player = makePlayer({ stamina: 80 })
    const { player: result } = applyChampionTraining(player, 'champ-a', [], [], rng)
    expect(result.stamina).toBe(72)
  })

  it('session.staminaCost is 8', () => {
    const player = makePlayer({ stamina: 80 })
    const { session } = applyChampionTraining(player, 'champ-a', [], [], rng)
    expect(session.staminaCost).toBe(8)
  })

  it('masteryLevel can increase for existing champion when rng favours it', () => {
    const alwaysIncrement = () => 0 // 0 < any positive probability → increment
    const player = makePlayer({
      potential: 80,
      championPool: [{ championId: 'champ-a', masteryLevel: 5 }],
    })
    const { player: result } = applyChampionTraining(player, 'champ-a', [], [], alwaysIncrement)
    const entry = result.championPool.find(c => c.championId === 'champ-a')
    expect(entry!.masteryLevel).toBe(6)
  })
})

describe('applyScrimTraining', () => {
  let rng: () => number

  beforeEach(() => {
    rng = seededRandom('test-scrim')
  })

  it('returns the same number of players as input', () => {
    const players = [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' }), makePlayer({ id: 'p3' })]
    const { players: results } = applyScrimTraining(players, [makeStaff()], rng)
    expect(results.length).toBe(3)
  })

  it('sessions.length equals teamPlayers.length', () => {
    const players = [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' })]
    const { sessions } = applyScrimTraining(players, [makeStaff()], rng)
    expect(sessions.length).toBe(2)
  })

  it('all returned players have lower stamina than initial (cost -6)', () => {
    const players = [
      makePlayer({ id: 'p1', stamina: 80 }),
      makePlayer({ id: 'p2', stamina: 60 }),
    ]
    const { players: results } = applyScrimTraining(players, [makeStaff()], rng)
    expect(results[0].stamina).toBe(74)
    expect(results[1].stamina).toBe(54)
  })

  it('does not mutate original players array', () => {
    const players = [makePlayer({ id: 'p1', stamina: 80 })]
    const originalStamina = players[0].stamina
    applyScrimTraining(players, [makeStaff()], rng)
    expect(players[0].stamina).toBe(originalStamina)
  })

  it('applies morale penalty when player stamina < 15', () => {
    const player = makePlayer({ id: 'p1', stamina: 10, morale: 70 })
    const { players: results } = applyScrimTraining([player], [makeStaff()], rng)
    expect(results[0].morale).toBeLessThan(70)
  })

  it('does not apply morale penalty when player stamina >= 15', () => {
    const player = makePlayer({ id: 'p1', stamina: 80, morale: 70 })
    const { players: results } = applyScrimTraining([player], [makeStaff()], rng)
    expect(results[0].morale).toBe(70)
  })

  it('handles empty array without error', () => {
    const { players: results, sessions } = applyScrimTraining([], [makeStaff()], rng)
    expect(results).toEqual([])
    expect(sessions).toEqual([])
  })

  it('session staminaCost is 6 per player', () => {
    const players = [makePlayer({ id: 'p1', stamina: 80 })]
    const { sessions } = applyScrimTraining(players, [makeStaff()], rng)
    expect(sessions[0].staminaCost).toBe(6)
  })
})
