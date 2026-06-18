import { useGameStore } from '../../store/useGameStore'
import type { View } from '../../store/useGameStore'
import { getPlayerOverallRating } from '@engine/players/player.model'
import { RoleBadge, StatBar } from '../components'
import type { SeasonPhase } from '@engine/calendar/season'
import type { DayActivityType } from '@engine/calendar/calendar'

const PHASE_LABELS: Record<SeasonPhase, string> = {
  preseason: 'Pré-Temporada',
  regularSeason: 'Temporada Regular',
  playoffs: 'Playoffs',
  offseason: 'Entressafra',
}

const PHASE_BADGE: Record<SeasonPhase, string> = {
  preseason: 'bg-gray-700 text-gray-200',
  regularSeason: 'bg-blue-800 text-blue-200',
  playoffs: 'bg-yellow-800 text-yellow-200',
  offseason: 'bg-green-900 text-green-300',
}

const ACTIVITY_ICONS: Record<DayActivityType, string> = {
  match: '⚔️',
  scrim: '🤝',
  general_training: '💪',
  champion_training: '🎯',
  rest: '😴',
  special_event: '⭐',
  offseason: '🏖️',
}

const ACTIVITY_LABELS: Record<DayActivityType, string> = {
  match: 'Jogo',
  scrim: 'Scrim',
  general_training: 'Treino Geral',
  champion_training: 'Treino Campeão',
  rest: 'Descanso',
  special_event: 'Evento Especial',
  offseason: 'Entressafra',
}

export function DashboardView() {
  const managedTeamId = useGameStore(s => s.managedTeamId)
  const currentDay = useGameStore(s => s.currentDay)
  const currentYear = useGameStore(s => s.currentYear)
  const seasonPhase = useGameStore(s => s.seasonPhase)
  const nextMatchFixture = useGameStore(s => s.nextMatchFixture)
  const budget = useGameStore(s => s.budget)
  const weeklyFinanceSummary = useGameStore(s => s.weeklyFinanceSummary)
  const players = useGameStore(s => s.players)
  const calendar = useGameStore(s => s.calendar)
  const advanceDay = useGameStore(s => s.advanceDay)
  const isLoading = useGameStore(s => s.isLoading)
  const simulateMatch = useGameStore(s => s.simulateMatch)
  const navigateTo = useGameStore(s => s.navigateTo)

  const starters = players.filter(p => p.isStarter)

  async function handleAdvanceDay() {
    const nextDay = currentDay + 1
    // Only auto-simulate when the managed team's own match falls on the next day
    const isOwnMatchDay =
      nextMatchFixture !== null &&
      nextMatchFixture.date.year === currentYear &&
      nextMatchFixture.date.dayOfYear === nextDay

    if (isOwnMatchDay && nextMatchFixture) {
      await advanceDay()
      await simulateMatch(nextMatchFixture)
      navigateTo('match' as View)
    } else {
      await advanceDay()
    }
  }

  // Next 7 days from current day
  const next7Days = calendar
    .filter(d => d.date.year === currentYear && d.date.dayOfYear > currentDay && d.date.dayOfYear <= currentDay + 7)
    .slice(0, 7)

  const phaseLabel = PHASE_LABELS[seasonPhase] ?? seasonPhase

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Ano {currentYear} · Dia {currentDay} —{' '}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${PHASE_BADGE[seasonPhase]}`}>
              {phaseLabel}
            </span>
          </p>
        </div>
        <button
          onClick={() => void handleAdvanceDay()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded transition-colors text-sm font-medium"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            '▶'
          )}
          Avançar Dia
        </button>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Próxima Partida */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">⚔️ Próxima Partida</h2>
          {nextMatchFixture ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${nextMatchFixture.teamA === managedTeamId ? 'text-blue-400' : 'text-gray-300'}`}>
                  {nextMatchFixture.teamA}
                </span>
                <span className="text-gray-500 text-sm font-bold">VS</span>
                <span className={`font-semibold ${nextMatchFixture.teamB === managedTeamId ? 'text-blue-400' : 'text-gray-300'}`}>
                  {nextMatchFixture.teamB}
                </span>
              </div>
              <p className="text-gray-500 text-xs">Dia {nextMatchFixture.date.dayOfYear}, Ano {nextMatchFixture.date.year}</p>
              <button
                onClick={() => {
                  void simulateMatch(nextMatchFixture).then(() => {
                    navigateTo('match' as View)
                  })
                }}
                disabled={isLoading}
                className="w-full mt-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded text-sm transition-colors"
              >
                {isLoading ? 'A simular...' : 'Simular e Ver Partida'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma partida agendada.</p>
          )}
        </div>

        {/* Card 2: Plantel (resumo) */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">🏅 Plantel</h2>
          {starters.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum titular carregado.</p>
          ) : (
            <div className="space-y-2">
              {starters.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <RoleBadge role={p.role} />
                  <span className="text-gray-200 text-sm flex-1 truncate">{p.name}</span>
                  <span className="text-yellow-400 text-xs font-mono">★ {getPlayerOverallRating(p).toFixed(1)}</span>
                  <div className="w-16">
                    <StatBar label="" value={p.stamina} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Finanças */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">💰 Finanças</h2>
          <div className="text-2xl font-bold font-mono text-green-400 mb-3">
            € {budget.toLocaleString('pt-PT')}
          </div>
          {weeklyFinanceSummary ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Receita semanal</span>
                <span className="text-green-400 font-mono">+ € {weeklyFinanceSummary.revenue.toLocaleString('pt-PT')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Despesas semanais</span>
                <span className="text-red-400 font-mono">- € {weeklyFinanceSummary.expenses.toLocaleString('pt-PT')}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-xs">Processa a semana para ver o resumo financeiro.</p>
          )}
        </div>

        {/* Card 4: Calendário (resumo) */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📅 Próximos 7 Dias</h2>
          {next7Days.length === 0 ? (
            <p className="text-gray-500 text-sm">Sem actividades agendadas.</p>
          ) : (
            <div className="space-y-1">
              {next7Days.map(d => (
                <div key={d.date.dayOfYear} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 font-mono text-xs w-12">Dia {d.date.dayOfYear}</span>
                  <span>{ACTIVITY_ICONS[d.activity.type]}</span>
                  <span className="text-gray-300 text-xs">{ACTIVITY_LABELS[d.activity.type]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
