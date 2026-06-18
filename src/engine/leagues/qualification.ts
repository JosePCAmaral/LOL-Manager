/**
 * qualification.ts — playoff qualification and bracket generation.
 *
 * MVP scope: Tier 1 leagues only, no relegation.
 * All functions are pure / immutable.
 */

import type { StandingEntry } from '@types-app/index'
import { sortStandings, getTopN } from './standings'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of teams that qualify for playoffs from the regular season. */
export const PLAYOFF_SPOTS = 6

/** Number of relegation spots (0 in the MVP — no Tier 2 yet). */
export const RELEGATION_SPOTS = 0

// ---------------------------------------------------------------------------
// Playoff bracket types
// ---------------------------------------------------------------------------

export interface PlayoffMatch {
  id: string
  round: 'semifinal' | 'final'
  teamA: string
  teamB: string
  winner: string | null
  played: boolean
}

export interface PlayoffBracket {
  leagueId: string
  year: number
  semifinalMatches: PlayoffMatch[]
  finalMatch: PlayoffMatch | null
  champion: string | null
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns the top PLAYOFF_SPOTS teams from the sorted standings.
 */
export function getPlayoffQualifiers(standings: StandingEntry[]): StandingEntry[] {
  return getTopN(standings, PLAYOFF_SPOTS)
}

/**
 * Generates the playoff bracket from the league standings.
 *
 * Seeding: top 6 by standings.
 * Semifinal matchups: 1st vs 6th, 2nd vs 5th, 3rd vs 4th.
 * Final: winners of SF1 and SF2 advance (SF3 winner does not advance to final).
 */
export function generatePlayoffBracket(
  standings: StandingEntry[],
  leagueId: string,
  year: number,
): PlayoffBracket {
  const qualifiers = getPlayoffQualifiers(standings)
  const sorted = sortStandings(qualifiers)

  const get = (i: number): string => sorted[i]?.teamId ?? `unknown-${i}`

  const semifinalMatches: PlayoffMatch[] = [
    {
      id: `playoff-${leagueId}-${year}-sf1`,
      round: 'semifinal',
      teamA: get(0),
      teamB: get(5),
      winner: null,
      played: false,
    },
    {
      id: `playoff-${leagueId}-${year}-sf2`,
      round: 'semifinal',
      teamA: get(1),
      teamB: get(4),
      winner: null,
      played: false,
    },
    {
      id: `playoff-${leagueId}-${year}-sf3`,
      round: 'semifinal',
      teamA: get(2),
      teamB: get(3),
      winner: null,
      played: false,
    },
  ]

  return {
    leagueId,
    year,
    semifinalMatches,
    finalMatch: null,
    champion: null,
  }
}

/**
 * Applies a playoff match result to the bracket (immutable).
 *
 * If all semifinals are played, automatically creates the final match
 * between the winners of SF1 and SF2 (SF3 winner does not advance).
 * If the final is played, sets the champion.
 */
export function applyPlayoffResult(
  bracket: PlayoffBracket,
  matchId: string,
  winnerId: string,
): PlayoffBracket {
  // Update semifinal matches
  let newSemis = bracket.semifinalMatches.map(m =>
    m.id === matchId ? { ...m, winner: winnerId, played: true } : m
  )

  // Update final match if the matchId refers to the final
  let newFinal = bracket.finalMatch
  if (newFinal && newFinal.id === matchId) {
    newFinal = { ...newFinal, winner: winnerId, played: true }
  }

  // If all semis played and no final yet, create the final
  const allSemisPlayed = newSemis.every(m => m.played)
  if (allSemisPlayed && newFinal === null) {
    const sf1Winner = newSemis[0].winner
    const sf2Winner = newSemis[1].winner
    if (sf1Winner && sf2Winner) {
      newFinal = {
        id: `playoff-${bracket.leagueId}-${bracket.year}-final`,
        round: 'final',
        teamA: sf1Winner,
        teamB: sf2Winner,
        winner: null,
        played: false,
      }
    }
  }

  // Determine champion if final is played
  const champion = newFinal?.played ? (newFinal.winner ?? null) : null

  return {
    ...bracket,
    semifinalMatches: newSemis,
    finalMatch: newFinal,
    champion,
  }
}

/**
 * Returns champion, runner-up and third-place from a completed bracket.
 *
 * - champion: winner of the final
 * - runnerUp: loser of the final
 * - thirdPlace: winner of SF3 (the consolation bracket)
 */
export function getPlayoffStandings(bracket: PlayoffBracket): {
  champion: string | null
  runnerUp: string | null
  thirdPlace: string | null
} {
  const final = bracket.finalMatch
  let champion: string | null = null
  let runnerUp: string | null = null

  if (final?.played && final.winner) {
    champion = final.winner
    runnerUp = final.teamA === final.winner ? final.teamB : final.teamA
  }

  const sf3 = bracket.semifinalMatches[2]
  const thirdPlace = sf3?.played ? (sf3.winner ?? null) : null

  return { champion, runnerUp, thirdPlace }
}

/**
 * Returns true if `teamId` is mathematically eliminated from reaching a
 * playoff spot — i.e. even winning all remaining games cannot move them into
 * the top PLAYOFF_SPOTS.
 *
 * @param teamId      The team to check.
 * @param standings   Current standings (all teams).
 * @param totalGames  Total regular-season games each team plays.
 */
export function isEliminated(
  teamId: string,
  standings: StandingEntry[],
  totalGames: number,
): boolean {
  const entry = standings.find(e => e.teamId === teamId)
  if (!entry) return true

  const gamesPlayed = entry.wins + entry.losses
  const gamesRemaining = totalGames - gamesPlayed
  const maxPossibleWins = entry.wins + gamesRemaining

  // Sort standings descending by wins to find the PLAYOFF_SPOTS-th team's wins.
  const sorted = sortStandings(standings)

  // The team occupying the last playoff spot (index PLAYOFF_SPOTS - 1).
  // If fewer teams exist than PLAYOFF_SPOTS, the team is never eliminated.
  if (sorted.length <= PLAYOFF_SPOTS) return false

  const cutoffEntry = sorted[PLAYOFF_SPOTS - 1]

  // If the cutoff team is us, we're in — not eliminated.
  if (cutoffEntry.teamId === teamId) return false

  // Eliminated if our theoretical maximum wins are strictly less than what the
  // current PLAYOFF_SPOTS-th team already has.
  return maxPossibleWins < cutoffEntry.wins
}
