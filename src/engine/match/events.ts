/**
 * events.ts — Timeline event generation for match simulation.
 *
 * Source of truth: docs/simulacao_e_draft.md, section 7.
 *
 * Reuses the MatchEvent union type from @types-app/index — no new event types defined here.
 *
 * Design decisions made independently and flagged for human review:
 * - KILL_SCORE_THRESHOLD = 1.0 — lane score margin above which a kill event is generated.
 * - TOWER_GOLD_THRESHOLD = 100 — goldDiff in gold above which a tower event is generated.
 *   (Section 7 mentions "TOWER_GOLD_THRESHOLD" but gives no value; 100 gold is a placeholder.)
 * - Kill events use placeholder killer/victim IDs derived from team side ("blue-0" etc.)
 *   because the MatchEvent type requires `killer: string` and `victim: string` player IDs,
 *   but the simulation phases don't track individual player IDs at this granularity.
 *   The actual player IDs are not passed to event generators; real IDs would require
 *   passing the full Player[] arrays here. Flagged as a future improvement.
 * - goldUpdate events are generated every 5 minutes, gold estimated from cumulative lead.
 * - Objective names: 'dragon', 'herald', 'baron' — chosen to match real LoL events.
 * - All time values are integers (Math.floor of computed float).
 */

import type { MatchEvent, Player } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import type { LaneResult } from './phases/laningPhase'
import type { MidGameResult } from './phases/midGamePhase'
import type { TeamfightResult } from './phases/teamfightPhase'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Score margin required to generate a kill event from a lane result.
 * DESIGN DECISION — not in the doc.
 */
const KILL_SCORE_THRESHOLD = 1.0

/**
 * Gold difference threshold above which a tower destruction event is generated.
 * DESIGN DECISION — doc mentions this constant but gives no value; 100 is placeholder.
 */
const TOWER_GOLD_THRESHOLD = 100

/** Lane names used for towerDestroyed events. */
const LANE_NAMES: Record<string, string> = {
  TOP:     'top',
  JUNGLE:  'mid',   // jungle doesn't have a lane tower; mapped to mid for event purposes
  MID:     'mid',
  ADC:     'bot',
  SUPPORT: 'bot',
}

const OBJECTIVES: string[] = ['dragon', 'herald', 'baron']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomMinute(base: number, range: number, rng: SeededRng): number {
  return Math.floor(base + rng() * range)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates events for the laning phase (minutes 0–14).
 * - Kill events when lane winner margin > KILL_SCORE_THRESHOLD.
 * - Tower events when |goldDiff| > TOWER_GOLD_THRESHOLD.
 */
export function generateLaningEvents(
  laneResults: LaneResult[],
  baseMinute: number,
  rng: SeededRng,
  bluePlayers?: Player[],
  redPlayers?: Player[],
): MatchEvent[] {
  const events: MatchEvent[] = []

  const ROLE_ORDER = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

  for (const result of laneResults) {
    const { role, winner, goldDiff, blueScore, redScore } = result

    if (winner !== 'draw') {
      const margin  = Math.abs(blueScore - redScore)
      const killChance = Math.min(0.9, margin / 10)  // DESIGN DECISION

      if (rng() < killChance) {
        const time    = randomMinute(baseMinute, 14, rng)
        const killerSide = winner
        const victimSide = winner === 'blue' ? 'red' : 'blue'
        const roleIdx = ROLE_ORDER.indexOf(role)

        // Use real player IDs when players are provided; fall back to side-role string
        const killerPlayers = killerSide === 'blue' ? bluePlayers : redPlayers
        const victimPlayers = victimSide === 'blue' ? bluePlayers : redPlayers
        const killerId = roleIdx >= 0 && killerPlayers?.[roleIdx]
          ? killerPlayers[roleIdx].id
          : `${killerSide}-${role}`
        const victimId = roleIdx >= 0 && victimPlayers?.[roleIdx]
          ? victimPlayers[roleIdx].id
          : `${victimSide}-${role}`

        events.push({
          type:    'kill',
          time,
          killer:  killerId,
          victim:  victimId,
          assists: [],
        })
      }

      // Tower destroyed if gold diff exceeds threshold
      if (Math.abs(goldDiff) > TOWER_GOLD_THRESHOLD) {
        const towerTeam = goldDiff > 0 ? 'blue' : 'red'
        events.push({
          type: 'towerDestroyed',
          time: randomMinute(baseMinute + 5, 9, rng),
          team: towerTeam,
          lane: LANE_NAMES[role] ?? 'mid',
        })
      }
    }
  }

  return events.sort((a, b) => a.time - b.time)
}

/**
 * Generates events for the mid game phase (minutes 15–24).
 * - Objective events for each captured objective.
 * - Kill events proportional to gold lead difference.
 */
export function generateMidGameEvents(
  midGameResult: MidGameResult,
  baseMinute: number,
  rng: SeededRng,
  bluePlayers?: Player[],
  redPlayers?: Player[],
): MatchEvent[] {
  const events: MatchEvent[] = []
  const phaseEnd = baseMinute + 10

  // Objective events
  for (let i = 0; i < midGameResult.blueObjectives; i++) {
    events.push({
      type:      'objective',
      time:      randomMinute(baseMinute, phaseEnd - baseMinute, rng),
      team:      'blue',
      objective: OBJECTIVES[i % OBJECTIVES.length],
    })
  }
  for (let i = 0; i < midGameResult.redObjectives; i++) {
    events.push({
      type:      'objective',
      time:      randomMinute(baseMinute, phaseEnd - baseMinute, rng),
      team:      'red',
      objective: OBJECTIVES[i % OBJECTIVES.length],
    })
  }

  // Kill events from gold lead — DESIGN DECISION: 1 kill per 150 gold lead
  const goldDiff   = midGameResult.blueGoldLead - midGameResult.redGoldLead
  const killCount  = Math.floor(Math.abs(goldDiff) / 150)
  const killTeam   = goldDiff >= 0 ? 'blue' : 'red'
  const victimTeam = killTeam === 'blue' ? 'red' : 'blue'

  const ROLE_ORDER_MID = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
  const midRoleIdx = ROLE_ORDER_MID.indexOf('MID') // index 2

  for (let i = 0; i < killCount && i < 5; i++) {
    const kPlayers = killTeam === 'blue' ? bluePlayers : redPlayers
    const vPlayers = victimTeam === 'blue' ? bluePlayers : redPlayers
    const killerId = kPlayers?.[midRoleIdx]?.id ?? `${killTeam}-mid`
    const victimId = vPlayers?.[midRoleIdx]?.id ?? `${victimTeam}-mid`

    events.push({
      type:    'kill',
      time:    randomMinute(baseMinute, phaseEnd - baseMinute, rng),
      killer:  killerId,
      victim:  victimId,
      assists: [],
    })
  }

  return events.sort((a, b) => a.time - b.time)
}

/**
 * Generates events for the teamfight phase (minutes 25–40+).
 * - Per teamfight win: kills and possibly an objective.
 */
export function generateTeamfightEvents(
  teamfightResult: TeamfightResult,
  baseMinute: number,
  rng: SeededRng,
  bluePlayers?: Player[],
  redPlayers?: Player[],
): MatchEvent[] {
  const events: MatchEvent[] = []
  const phaseRange = 15

  const TF_ROLE_ORDER = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
  const midIdx = TF_ROLE_ORDER.indexOf('MID')    // 2
  const jglIdx = TF_ROLE_ORDER.indexOf('JUNGLE') // 1

  const processWins = (team: 'blue' | 'red', wins: number): void => {
    const victimTeam = team === 'blue' ? 'red' : 'blue'
    const teamPlayers = team === 'blue' ? bluePlayers : redPlayers
    const vTeamPlayers = victimTeam === 'blue' ? bluePlayers : redPlayers

    for (let i = 0; i < wins; i++) {
      const time = randomMinute(baseMinute, phaseRange, rng)

      // Kills per teamfight win — DESIGN DECISION: 2-4 kills
      const killCount = 2 + Math.floor(rng() * 3)
      const killerId = teamPlayers?.[midIdx]?.id ?? `${team}-mid`
      const jglId    = teamPlayers?.[jglIdx]?.id ?? `${team}-jungle`

      for (let k = 0; k < killCount; k++) {
        const victimId = vTeamPlayers?.[midIdx]?.id ?? `${victimTeam}-mid`
        events.push({
          type:    'kill',
          time:    time + k,
          killer:  killerId,
          victim:  victimId,
          assists: [jglId],
        })
      }

      // Objective after teamfight win — 60% chance — DESIGN DECISION
      if (rng() < 0.6) {
        events.push({
          type:      'objective',
          time:      time + killCount,
          team,
          objective: i === 0 ? 'baron' : 'dragon',
        })
      }
    }
  }

  processWins('blue', teamfightResult.blueWins)
  processWins('red',  teamfightResult.redWins)

  return events.sort((a, b) => a.time - b.time)
}

// ---------------------------------------------------------------------------
// Item purchase events (Correction 9)
// ---------------------------------------------------------------------------

const ITEMS = [
  'Rabadon', 'Trinity Force', 'Infinity Edge', 'Zhonya',
  'Sunfire', 'Locket', 'Kraken Slayer', 'Eclipse',
]

const ITEM_ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

/**
 * Generates item purchase events during the mid game (minutes 15–25).
 * Simulates 3-6 important item purchases by random players.
 * When bluePlayers/redPlayers are provided, uses real player IDs.
 */
export function generateItemEvents(
  rng: SeededRng,
  bluePlayers?: Player[],
  redPlayers?: Player[],
): MatchEvent[] {
  const events: MatchEvent[] = []
  const count = 3 + Math.floor(rng() * 4)

  for (let i = 0; i < count; i++) {
    const minute = 15 + Math.floor(rng() * 10)
    const isBlue = rng() > 0.5
    const roleIdx = Math.floor(rng() * 5)
    const roleName = ITEM_ROLES[roleIdx]
    const sidePlayers = isBlue ? bluePlayers : redPlayers
    const side = isBlue ? 'blue' : 'red'
    const playerId = sidePlayers?.[roleIdx]?.id ?? `${side}-${roleName}`
    const item = ITEMS[Math.floor(rng() * ITEMS.length)]

    events.push({
      type: 'itemPurchase',
      time: minute * 60,
      player: playerId,
      item,
    } as MatchEvent)
  }

  return events
}

/**
 * Generates goldUpdate events at 5-minute intervals throughout the match.
 * Gold values are estimated from cumulative lane and mid-game leads.
 */
export function generateGoldUpdates(
  laneResults: LaneResult[],
  midGameResult: MidGameResult,
  rng: SeededRng,
): MatchEvent[] {
  const events: MatchEvent[] = []

  const totalLaneGoldDiff = laneResults.reduce((s, r) => s + r.goldDiff, 0)
  const baseBlueGold  = 1000  // approximate starting gold per team at minute 0 — DESIGN DECISION
  const baseRedGold   = 1000

  for (let minute = 5; minute <= 35; minute += 5) {
    // Gold accumulates linearly with time and lane/mid leads — DESIGN DECISION
    const scaleFactor = minute / 35
    const blueGold = Math.round(
      baseBlueGold + minute * 300 + totalLaneGoldDiff * scaleFactor * 0.5 + midGameResult.blueGoldLead * scaleFactor + (rng() - 0.5) * 200
    )
    const redGold = Math.round(
      baseRedGold  + minute * 300 - totalLaneGoldDiff * scaleFactor * 0.5 + midGameResult.redGoldLead  * scaleFactor + (rng() - 0.5) * 200
    )

    events.push({
      type:     'goldUpdate',
      time:     minute,
      teamGold: [Math.max(0, blueGold), Math.max(0, redGold)],
    })
  }

  return events
}
