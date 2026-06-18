/**
 * draftEngine.ts — Controls the ban/pick flow for a match draft.
 *
 * Implements the official LoL draft sequence (10 bans + 10 picks = 20 slots).
 * All state is immutable: functions return new objects, never mutate arguments.
 */

import type { Player, Champion, DraftResult } from '@types-app/index'
import type { Role } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { suggestBan, suggestPick } from './aiSuggestion'

// ---------------------------------------------------------------------------
// Auxiliary types (re-exported for consumers)
// ---------------------------------------------------------------------------

export type DraftPhase = 'ban1' | 'pick1' | 'ban2' | 'pick2'
export type DraftTeam = 'blue' | 'red'

export interface DraftSlot {
  phase: DraftPhase
  team: DraftTeam
  action: 'ban' | 'pick'
  /** Role is only set when action === 'pick'. */
  role?: Role
  /** null means not yet chosen. */
  championId: string | null
}

export interface DraftState {
  slots: DraftSlot[]
  currentSlotIndex: number
  blueBans: string[]
  redBans: string[]
  bluePicks: Partial<Record<Role, string>>
  redPicks: Partial<Record<Role, string>>
  finished: boolean
}

// ---------------------------------------------------------------------------
// Draft sequence definition
// ---------------------------------------------------------------------------

/**
 * The official LoL draft sequence: 20 slots.
 *
 * Ban phase 1 (6 bans, alternating B/R × 3):
 *   0: blue ban, 1: red ban, 2: blue ban, 3: red ban, 4: blue ban, 5: red ban
 *
 * Pick phase 1 (6 picks, snake order):
 *   6: blue pick, 7: red pick, 8: red pick, 9: blue pick, 10: blue pick, 11: red pick
 *
 * Ban phase 2 (4 bans, alternating B/R × 2):
 *   12: blue ban, 13: red ban, 14: blue ban, 15: red ban
 *
 * Pick phase 2 (4 picks, reverse snake):
 *   16: red pick, 17: blue pick, 18: red pick, 19: blue pick
 *
 * Role assignment for picks follows standard LoL convention:
 *   Pick 1 (slot 6):  blue  → TOP
 *   Pick 2 (slot 7):  red   → TOP
 *   Pick 3 (slot 8):  red   → JUNGLE
 *   Pick 4 (slot 9):  blue  → JUNGLE
 *   Pick 5 (slot 10): blue  → MID
 *   Pick 6 (slot 11): red   → MID
 *   Pick 7 (slot 16): red   → ADC
 *   Pick 8 (slot 17): blue  → ADC
 *   Pick 9 (slot 18): red   → SUPPORT
 *   Pick 10 (slot 19): blue → SUPPORT
 *
 * Decision (own — doc does not specify pick-to-role mapping): standard
 * competitive LoL uses roughly this order. The exact mapping is arbitrary
 * for simulation purposes; flagged for human review.
 */
const DRAFT_SEQUENCE: Omit<DraftSlot, 'championId'>[] = [
  // Ban phase 1
  { phase: 'ban1', team: 'blue', action: 'ban' },       // 0
  { phase: 'ban1', team: 'red',  action: 'ban' },       // 1
  { phase: 'ban1', team: 'blue', action: 'ban' },       // 2
  { phase: 'ban1', team: 'red',  action: 'ban' },       // 3
  { phase: 'ban1', team: 'blue', action: 'ban' },       // 4
  { phase: 'ban1', team: 'red',  action: 'ban' },       // 5
  // Pick phase 1
  { phase: 'pick1', team: 'blue', action: 'pick', role: 'TOP'    }, // 6
  { phase: 'pick1', team: 'red',  action: 'pick', role: 'TOP'    }, // 7
  { phase: 'pick1', team: 'red',  action: 'pick', role: 'JUNGLE' }, // 8
  { phase: 'pick1', team: 'blue', action: 'pick', role: 'JUNGLE' }, // 9
  { phase: 'pick1', team: 'blue', action: 'pick', role: 'MID'    }, // 10
  { phase: 'pick1', team: 'red',  action: 'pick', role: 'MID'    }, // 11
  // Ban phase 2
  { phase: 'ban2', team: 'blue', action: 'ban' },       // 12
  { phase: 'ban2', team: 'red',  action: 'ban' },       // 13
  { phase: 'ban2', team: 'blue', action: 'ban' },       // 14
  { phase: 'ban2', team: 'red',  action: 'ban' },       // 15
  // Pick phase 2
  { phase: 'pick2', team: 'red',  action: 'pick', role: 'ADC'     }, // 16
  { phase: 'pick2', team: 'blue', action: 'pick', role: 'ADC'     }, // 17
  { phase: 'pick2', team: 'red',  action: 'pick', role: 'SUPPORT' }, // 18
  { phase: 'pick2', team: 'blue', action: 'pick', role: 'SUPPORT' }, // 19
]

// ---------------------------------------------------------------------------
// createDraftState
// ---------------------------------------------------------------------------

/**
 * Initialises a fresh DraftState with all 20 slots empty (championId = null).
 */
export function createDraftState(): DraftState {
  const slots: DraftSlot[] = DRAFT_SEQUENCE.map(s => ({ ...s, championId: null }))
  return {
    slots,
    currentSlotIndex: 0,
    blueBans: [],
    redBans: [],
    bluePicks: {},
    redPicks: {},
    finished: false,
  }
}

// ---------------------------------------------------------------------------
// applyDraftAction
// ---------------------------------------------------------------------------

/**
 * Fills the current slot with the given championId and advances the draft.
 * Returns a new DraftState (does not mutate the argument).
 *
 * Throws if the draft is already finished or the slot index is out of range.
 */
export function applyDraftAction(state: DraftState, championId: string): DraftState {
  if (state.finished) {
    throw new Error('applyDraftAction: draft is already finished')
  }
  if (state.currentSlotIndex >= 20) {
    throw new Error(`applyDraftAction: currentSlotIndex ${state.currentSlotIndex} is out of range`)
  }

  const slot = state.slots[state.currentSlotIndex]

  // Build updated slots array (immutable)
  const newSlots = state.slots.map((s, i) =>
    i === state.currentSlotIndex ? { ...s, championId } : s
  )

  // Update ban/pick collections
  const newBlueBans = slot.team === 'blue' && slot.action === 'ban'
    ? [...state.blueBans, championId]
    : [...state.blueBans]

  const newRedBans = slot.team === 'red' && slot.action === 'ban'
    ? [...state.redBans, championId]
    : [...state.redBans]

  const newBluePicks: Partial<Record<Role, string>> = { ...state.bluePicks }
  const newRedPicks: Partial<Record<Role, string>> = { ...state.redPicks }

  if (slot.action === 'pick' && slot.role !== undefined) {
    if (slot.team === 'blue') {
      newBluePicks[slot.role] = championId
    } else {
      newRedPicks[slot.role] = championId
    }
  }

  const nextIndex = state.currentSlotIndex + 1
  const finished = nextIndex >= 20

  return {
    slots: newSlots,
    currentSlotIndex: nextIndex,
    blueBans: newBlueBans,
    redBans: newRedBans,
    bluePicks: newBluePicks,
    redPicks: newRedPicks,
    finished,
  }
}

// ---------------------------------------------------------------------------
// draftStateToResult
// ---------------------------------------------------------------------------

/**
 * Converts a finished DraftState into a DraftResult keyed by teamId strings
 * 'blue' and 'red'. Throws if the draft is not finished.
 *
 * Note: DraftResult uses Record<string, string[]> for bans and
 * Record<string, Record<Role, string>> for picks (from src/types/index.ts).
 * The keys here are the literal strings 'blue' and 'red'; callers that need
 * real teamIds should remap after calling this function.
 */
export function draftStateToResult(state: DraftState): DraftResult {
  if (!state.finished) {
    throw new Error('draftStateToResult: draft is not finished yet')
  }
  return {
    bans: {
      blue: [...state.blueBans],
      red: [...state.redBans],
    },
    picks: {
      blue: state.bluePicks as Record<Role, string>,
      red: state.redPicks as Record<Role, string>,
    },
  }
}

// ---------------------------------------------------------------------------
// runAutoDraft
// ---------------------------------------------------------------------------

/**
 * Runs a complete auto-draft using AI suggestions for both sides.
 *
 * @param blueTeamId  - Identifier for the blue-side team (used as key in DraftResult).
 * @param redTeamId   - Identifier for the red-side team.
 * @param bluePlayers - The 5 starters for the blue side, indexed by role.
 * @param redPlayers  - The 5 starters for the red side, indexed by role.
 * @param allChampions - Full champion catalogue.
 * @param rng          - Seeded RNG instance.
 * @returns A DraftResult keyed by the provided teamIds.
 */
export function runAutoDraft(
  blueTeamId: string,
  redTeamId: string,
  bluePlayers: Player[],
  redPlayers: Player[],
  allChampions: Champion[],
  rng: SeededRng
): DraftResult {
  let state = createDraftState()

  while (!state.finished) {
    const slot = state.slots[state.currentSlotIndex]
    const allBanned = [...state.blueBans, ...state.redBans]
    const allPicked = [
      ...Object.values(state.bluePicks).filter((v): v is string => v !== undefined),
      ...Object.values(state.redPicks).filter((v): v is string => v !== undefined),
    ]

    let championId: string

    if (slot.action === 'ban') {
      const enemyPlayers = slot.team === 'blue' ? redPlayers : bluePlayers
      championId = suggestBan(
        slot.team,
        state,
        enemyPlayers,
        allChampions,
        rng
      )
    } else {
      // pick — role is guaranteed for pick slots
      const role = slot.role as Role
      const teamPlayers = slot.team === 'blue' ? bluePlayers : redPlayers
      const teamPicks = slot.team === 'blue' ? state.bluePicks : state.redPicks

      // Resolve teammate champions already picked this draft
      const teammateChampions = resolveTeammateChampions(teamPicks, allChampions)

      championId = suggestPick(
        slot.team,
        role,
        state,
        teamPlayers,
        teammateChampions,
        allChampions,
        allBanned,
        allPicked,
        rng
      )
    }

    state = applyDraftAction(state, championId)
  }

  // Remap 'blue'/'red' keys to real teamIds
  const rawResult = draftStateToResult(state)
  return {
    bans: {
      [blueTeamId]: rawResult.bans['blue'],
      [redTeamId]:  rawResult.bans['red'],
    },
    picks: {
      [blueTeamId]: rawResult.picks['blue'] as Record<Role, string>,
      [redTeamId]:  rawResult.picks['red']  as Record<Role, string>,
    },
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveTeammateChampions(
  picks: Partial<Record<Role, string>>,
  allChampions: Champion[]
): Champion[] {
  const result: Champion[] = []
  for (const championId of Object.values(picks)) {
    if (championId === undefined) continue
    const champ = allChampions.find(c => c.id === championId)
    if (champ !== undefined) result.push(champ)
  }
  return result
}
