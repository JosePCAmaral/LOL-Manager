import { describe, it, expect } from 'vitest'
import {
  applyMoraleDecay,
  applyWinBonus,
  applyLossPenalty,
  applyMoraleFromStamina,
  recoverStamina,
} from '@engine/players/morale'
import { makePlayer } from '../helpers'

describe('applyMoraleDecay', () => {
  it('decreases morale by 1', () => {
    const p = makePlayer({ morale: 50 })
    expect(applyMoraleDecay(p).morale).toBe(49)
  })

  it('morale=0 stays at 0 (does not go negative)', () => {
    const p = makePlayer({ morale: 0 })
    expect(applyMoraleDecay(p).morale).toBe(0)
  })

  it('morale=1 goes to 0', () => {
    const p = makePlayer({ morale: 1 })
    expect(applyMoraleDecay(p).morale).toBe(0)
  })

  it('does not mutate the original player', () => {
    const p = makePlayer({ morale: 50 })
    const clone = JSON.parse(JSON.stringify(p))
    applyMoraleDecay(p)
    expect(p).toEqual(clone)
  })
})

describe('applyWinBonus', () => {
  it('increases morale by 3', () => {
    const p = makePlayer({ morale: 50 })
    expect(applyWinBonus(p).morale).toBe(53)
  })

  it('morale=99 goes to 100, not 102 (capped)', () => {
    const p = makePlayer({ morale: 99 })
    expect(applyWinBonus(p).morale).toBe(100)
  })

  it('morale=100 stays at 100', () => {
    const p = makePlayer({ morale: 100 })
    expect(applyWinBonus(p).morale).toBe(100)
  })

  it('does not mutate the original player', () => {
    const p = makePlayer({ morale: 50 })
    const clone = JSON.parse(JSON.stringify(p))
    applyWinBonus(p)
    expect(p).toEqual(clone)
  })
})

describe('applyLossPenalty', () => {
  it('decreases morale by 2', () => {
    const p = makePlayer({ morale: 50 })
    expect(applyLossPenalty(p).morale).toBe(48)
  })

  it('morale=1 goes to 0, not -1 (clamped)', () => {
    const p = makePlayer({ morale: 1 })
    expect(applyLossPenalty(p).morale).toBe(0)
  })

  it('morale=0 stays at 0', () => {
    const p = makePlayer({ morale: 0 })
    expect(applyLossPenalty(p).morale).toBe(0)
  })

  it('does not mutate the original player', () => {
    const p = makePlayer({ morale: 50 })
    const clone = JSON.parse(JSON.stringify(p))
    applyLossPenalty(p)
    expect(p).toEqual(clone)
  })
})

describe('applyMoraleFromStamina', () => {
  it('stamina=20 (< 30) decreases morale by 5', () => {
    const p = makePlayer({ stamina: 20, morale: 50 })
    expect(applyMoraleFromStamina(p).morale).toBe(45)
  })

  it('stamina=0 (< 30) decreases morale by 5, clamped at 0', () => {
    const p = makePlayer({ stamina: 0, morale: 3 })
    expect(applyMoraleFromStamina(p).morale).toBe(0)
  })

  it('stamina=90 (> 80) increases morale by 1', () => {
    const p = makePlayer({ stamina: 90, morale: 50 })
    expect(applyMoraleFromStamina(p).morale).toBe(51)
  })

  it('stamina=100 (> 80) increases morale by 1, capped at 100', () => {
    const p = makePlayer({ stamina: 100, morale: 100 })
    expect(applyMoraleFromStamina(p).morale).toBe(100)
  })

  it('stamina=50 (between 30 and 80) leaves morale unchanged', () => {
    const p = makePlayer({ stamina: 50, morale: 60 })
    const result = applyMoraleFromStamina(p)
    expect(result.morale).toBe(60)
    // should return the same reference since nothing changed
    expect(result).toBe(p)
  })

  it('stamina=30 is NOT < 30, so morale unchanged', () => {
    const p = makePlayer({ stamina: 30, morale: 60 })
    expect(applyMoraleFromStamina(p).morale).toBe(60)
  })

  it('stamina=80 is NOT > 80, so morale unchanged', () => {
    const p = makePlayer({ stamina: 80, morale: 60 })
    expect(applyMoraleFromStamina(p).morale).toBe(60)
  })

  it('does not mutate the original player', () => {
    const p = makePlayer({ stamina: 20, morale: 50 })
    const clone = JSON.parse(JSON.stringify(p))
    applyMoraleFromStamina(p)
    expect(p).toEqual(clone)
  })
})

describe('recoverStamina', () => {
  it('offseason: stamina increases by 5', () => {
    const p = makePlayer({ stamina: 60 })
    expect(recoverStamina(p, 'offseason').stamina).toBe(65)
  })

  it('regular: stamina increases by 2', () => {
    const p = makePlayer({ stamina: 60 })
    expect(recoverStamina(p, 'regular').stamina).toBe(62)
  })

  it('defaults to regular recovery when phase is omitted', () => {
    const p = makePlayer({ stamina: 60 })
    expect(recoverStamina(p).stamina).toBe(62)
  })

  it('offseason: stamina=98 goes to 100 (capped)', () => {
    const p = makePlayer({ stamina: 98 })
    expect(recoverStamina(p, 'offseason').stamina).toBe(100)
  })

  it('offseason: stamina=100 stays at 100', () => {
    const p = makePlayer({ stamina: 100 })
    expect(recoverStamina(p, 'offseason').stamina).toBe(100)
  })

  it('regular: stamina=99 goes to 100 (not 101)', () => {
    const p = makePlayer({ stamina: 99 })
    expect(recoverStamina(p, 'regular').stamina).toBe(100)
  })

  it('does not mutate the original player', () => {
    const p = makePlayer({ stamina: 60 })
    const clone = JSON.parse(JSON.stringify(p))
    recoverStamina(p, 'offseason')
    expect(p).toEqual(clone)
  })
})
