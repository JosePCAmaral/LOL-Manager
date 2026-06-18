import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { initStandings, applyMatchResult, sortStandings } from '@engine/leagues/standings'
import { teamRepository, matchResultRepository, leagueRepository } from '@persistence/index'
import type { StandingEntry, Team, League } from '@types-app/index'

const PLAYOFF_SPOTS = 6

export function StandingsView() {
  const managedTeamId = useGameStore(s => s.managedTeamId)
  const currentMatchResult = useGameStore(s => s.currentMatchResult)

  const [standings, setStandings] = useState<StandingEntry[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [league, setLeague] = useState<League | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [allTeams, allResults, allLeagues] = await Promise.all([
          teamRepository.getAll(),
          matchResultRepository.getAll(),
          leagueRepository.getAll(),
        ])

        const managedTeam = allTeams.find(t => t.id === managedTeamId)
        const managedLeague = allLeagues.find(l => l.id === managedTeam?.leagueId) ?? null
        const leagueTeamIds = managedLeague?.teamIds ?? []

        let table = initStandings(leagueTeamIds)
        for (const result of allResults) {
          // Only apply results where both teams are in this league
          if (leagueTeamIds.includes(result.teamA) && leagueTeamIds.includes(result.teamB)) {
            table = applyMatchResult(table, result)
          }
        }
        table = sortStandings(table)

        setStandings(table)
        setTeams(allTeams)
        setLeague(managedLeague)
      } catch (e) {
        console.error('[StandingsView] load error:', e)
        setError('Erro ao carregar classificacao.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [managedTeamId, currentMatchResult])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3" />
        A carregar classificacao...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-sm p-6">
        {error}
      </div>
    )
  }

  const teamMap = new Map(teams.map(t => [t.id, t]))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Classificacao</h1>
        {league && (
          <p className="text-gray-400 text-sm mt-1">
            {league.name} — {league.region}
          </p>
        )}
      </div>

      {standings.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500 text-sm">
          Nenhum jogo disputado ainda. Avanca o calendario para ver a classificacao.
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_1fr_3rem_3rem_4rem_8rem] gap-0 px-4 py-3 border-b border-gray-700 bg-gray-800/50">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide text-center">#</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Time</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide text-center">V</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide text-center">D</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide text-center">Jogos</span>
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide text-center">Forma</span>
          </div>

          {standings.map((entry, idx) => {
            const position = idx + 1
            const team = teamMap.get(entry.teamId)
            const teamName = team?.name ?? entry.teamId
            const isManaged = entry.teamId === managedTeamId
            const isTop = position === 1
            const inPlayoffs = position <= PLAYOFF_SPOTS
            const gamesPlayed = entry.wins + entry.losses

            // Separator before position 7 (elimination zone starts)
            const showPlayoffSeparator = position === PLAYOFF_SPOTS + 1

            return (
              <div key={entry.teamId}>
                {showPlayoffSeparator && (
                  <div className="relative h-px bg-yellow-700/40 mx-4 my-0">
                    <span className="absolute left-0 -top-3 text-yellow-600 text-xs px-1 bg-gray-900">
                      — Zona de Eliminacao
                    </span>
                  </div>
                )}

                <div
                  className={`grid grid-cols-[2.5rem_1fr_3rem_3rem_4rem_8rem] gap-0 px-4 py-3 border-b border-gray-800/50 transition-colors hover:bg-gray-800/30 ${
                    isManaged ? 'bg-blue-950/40' : ''
                  } ${inPlayoffs && !isManaged ? 'border-l-4 border-l-yellow-600/60' : ''} ${
                    isManaged && inPlayoffs ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  {/* Position */}
                  <div className="flex items-center justify-center">
                    <span
                      className={`text-sm font-bold ${
                        isTop
                          ? 'text-yellow-400'
                          : inPlayoffs
                          ? 'text-gray-300'
                          : 'text-gray-500'
                      }`}
                    >
                      {position}
                    </span>
                  </div>

                  {/* Team name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-sm font-medium truncate ${
                        isManaged ? 'text-blue-300 font-bold' : 'text-gray-200'
                      }`}
                    >
                      {teamName}
                    </span>
                    {isManaged && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-700 text-blue-100 font-semibold">
                        TU
                      </span>
                    )}
                    {isTop && !isManaged && (
                      <span className="shrink-0 text-yellow-400 text-xs">&#9733;</span>
                    )}
                  </div>

                  {/* Wins */}
                  <div className="flex items-center justify-center">
                    <span className="text-sm text-green-400 font-semibold">{entry.wins}</span>
                  </div>

                  {/* Losses */}
                  <div className="flex items-center justify-center">
                    <span className="text-sm text-red-400 font-semibold">{entry.losses}</span>
                  </div>

                  {/* Games played */}
                  <div className="flex items-center justify-center">
                    <span className="text-sm text-gray-400">{gamesPlayed}</span>
                  </div>

                  {/* Win rate bar */}
                  <div className="flex items-center justify-center">
                    {gamesPlayed > 0 ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${(entry.wins / gamesPlayed) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 w-8 text-right">
                          {Math.round((entry.wins / gamesPlayed) * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Legend */}
          <div className="px-4 py-3 bg-gray-800/20 flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-l-4 border-l-yellow-600/60 rounded-sm" />
              <span>Zona de Playoffs (Top {PLAYOFF_SPOTS})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-950/40 border border-blue-900 rounded-sm" />
              <span>Teu time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
