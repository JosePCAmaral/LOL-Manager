/**
 * Training module: general training, champion-focused training, and scrims.
 * All randomness passes through the rng parameter — never Math.random().
 * All functions return new objects (immutable).
 */

import type { Player, PlayerAttributes, StaffMember, Champion } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { applyTrainingBonus } from '../players/attributes'
import { getStaffBonus } from '../teams/staff.model'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrainingSession {
  playerId: string
  type: 'general' | 'champion_focus' | 'scrim'
  championId?: string
  attributeDeltas: Partial<PlayerAttributes>
  moraleChange: number
  staminaCost: number
  notes: string[]
}

type TrainingIntensity = 'low' | 'normal' | 'high'

/**
 * Maps intensity label to the numeric value passed to applyTrainingBonus.
 * Source: task spec (intensity in [0, 1]).
 */
const INTENSITY_VALUE: Record<TrainingIntensity, number> = {
  low: 0.3,
  normal: 0.6,
  high: 1.0,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clampStamina(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function clampMorale(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function computeDeltas(
  before: PlayerAttributes,
  after: PlayerAttributes,
): Partial<PlayerAttributes> {
  const deltas: Partial<PlayerAttributes> = {}
  const keys = Object.keys(before) as (keyof PlayerAttributes)[]
  for (const key of keys) {
    const delta = after[key] - before[key]
    if (delta !== 0) {
      deltas[key] = delta
    }
  }
  return deltas
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the player has enough stamina to train (minimum 10).
 */
export function canTrain(player: Player): boolean {
  return player.stamina >= 10
}

/**
 * Returns a training recommendation based on the player's current state.
 *
 * Decision order (from spec):
 *   1. stamina < 20 → rest
 *   2. morale < 30 → scrim
 *   3. any champion in pool with masteryLevel < 10 → champion_focus
 *   4. otherwise → general
 */
export function getTrainingRecommendation(
  player: Player,
): 'rest' | 'general' | 'champion_focus' | 'scrim' {
  if (player.stamina < 20) return 'rest'
  if (player.morale < 30) return 'scrim'
  const hasLowMastery = player.championPool.some(c => c.masteryLevel < 10)
  if (hasLowMastery) return 'champion_focus'
  return 'general'
}

/**
 * Applies general training to a single player.
 *
 * From spec:
 * - Staff bonus > 0.5 → high intensity; otherwise normal.
 * - Stamina cost: -10.
 * - If stamina < 20: extra -5 morale and note "Jogador exausto".
 *
 * Design decision: rng is accepted as a parameter for API consistency and
 * future expansion (e.g. random event during training), but general training
 * currently uses deterministic intensity-based bonuses via applyTrainingBonus.
 */
export function applyGeneralTraining(
  player: Player,
  staff: StaffMember[],
  rng: SeededRng,
): { player: Player; session: TrainingSession } {
  void rng // reserved for future probabilistic events

  const staffBonus = getStaffBonus(staff, 'training')
  const intensity: TrainingIntensity = staffBonus > 0.5 ? 'high' : 'normal'

  const beforeAttrs = player.attributes
  const afterAttrs = applyTrainingBonus(beforeAttrs, player.role, INTENSITY_VALUE[intensity])
  const deltas = computeDeltas(beforeAttrs, afterAttrs)

  const notes: string[] = []
  for (const [attr, delta] of Object.entries(deltas)) {
    if ((delta as number) > 0) notes.push(`${attr} +${delta}`)
  }

  const staminaCost = 10
  let moraleChange = 0

  if (player.stamina < 20) {
    moraleChange -= 5
    notes.push('Jogador exausto')
  }

  const newPlayer: Player = {
    ...player,
    attributes: afterAttrs,
    stamina: clampStamina(player.stamina - staminaCost),
    morale: clampMorale(player.morale + moraleChange),
  }

  const session: TrainingSession = {
    playerId: player.id,
    type: 'general',
    attributeDeltas: deltas,
    moraleChange,
    staminaCost,
    notes,
  }

  return { player: newPlayer, session }
}

/**
 * Applies champion-focused training.
 *
 * From spec:
 * - If champion not in pool, adds it at masteryLevel 1.
 * - Probability of mastery increment: 0.3 + (potential/100) × 0.4
 * - Maximum masteryLevel: 20.
 * - Stamina cost: -8; morale cost: -1.
 *
 * Design decision: _allChampions and _staff are accepted for future use
 * (e.g. champion-specific bonuses, staff modifiers on champion training)
 * but are not used in the current formula.
 */
export function applyChampionTraining(
  player: Player,
  championId: string,
  _allChampions: Champion[],
  _staff: StaffMember[],
  rng: SeededRng,
): { player: Player; session: TrainingSession } {
  const staminaCost = 8
  const moraleChange = -1
  const notes: string[] = []

  // Formula from spec: probability of increment
  const incrementProbability = 0.3 + (player.potential / 100) * 0.4

  let newPool = [...player.championPool]
  const existingIndex = newPool.findIndex(c => c.championId === championId)

  if (existingIndex === -1) {
    newPool.push({ championId, masteryLevel: 1 })
    notes.push(`${championId} adicionado ao pool (maestria 1)`)
  } else {
    const current = newPool[existingIndex]
    if (rng() < incrementProbability && current.masteryLevel < 20) {
      const newMastery = Math.min(20, current.masteryLevel + 1)
      newPool = [
        ...newPool.slice(0, existingIndex),
        { ...current, masteryLevel: newMastery },
        ...newPool.slice(existingIndex + 1),
      ]
      notes.push(`${championId} maestria +1 (agora ${newMastery})`)
    } else {
      notes.push(`${championId} sem progresso desta sessão`)
    }
  }

  const newPlayer: Player = {
    ...player,
    championPool: newPool,
    stamina: clampStamina(player.stamina - staminaCost),
    morale: clampMorale(player.morale + moraleChange),
  }

  const session: TrainingSession = {
    playerId: player.id,
    type: 'champion_focus',
    championId,
    attributeDeltas: {},
    moraleChange,
    staminaCost,
    notes,
  }

  return { player: newPlayer, session }
}

/**
 * Applies scrim training to an entire team of players.
 *
 * From spec:
 * - Each player: low-intensity general training.
 * - Stamina cost: -6 per player.
 * - If player stamina < 15: extra -3 morale.
 * - Staff bonus and intensity are acknowledged but intensity is always 'low' per spec.
 */
export function applyScrimTraining(
  teamPlayers: Player[],
  staff: StaffMember[],
  rng: SeededRng,
): { players: Player[]; sessions: TrainingSession[] } {
  void staff // intensity always 'low' per spec; staff future use
  void rng   // reserved for future probabilistic scrim events

  const results = teamPlayers.map(player => {
    const notes: string[] = []
    const staminaCost = 6
    let moraleChange = 0

    const beforeAttrs = player.attributes
    const afterAttrs = applyTrainingBonus(beforeAttrs, player.role, INTENSITY_VALUE.low)
    const deltas = computeDeltas(beforeAttrs, afterAttrs)

    for (const [attr, delta] of Object.entries(deltas)) {
      if ((delta as number) > 0) notes.push(`${attr} +${delta}`)
    }

    if (player.stamina < 15) {
      moraleChange -= 3
      notes.push('Stamina crítica durante scrim')
    }

    const newPlayer: Player = {
      ...player,
      attributes: afterAttrs,
      stamina: clampStamina(player.stamina - staminaCost),
      morale: clampMorale(player.morale + moraleChange),
    }

    const session: TrainingSession = {
      playerId: player.id,
      type: 'scrim',
      attributeDeltas: deltas,
      moraleChange,
      staminaCost,
      notes,
    }

    return { player: newPlayer, session }
  })

  return {
    players: results.map(r => r.player),
    sessions: results.map(r => r.session),
  }
}
