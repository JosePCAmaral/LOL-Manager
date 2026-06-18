import { useGameStore } from '../../store/useGameStore'

const PHASE_LABELS: Record<string, string> = {
  preseason: 'Pré-Temporada',
  regularSeason: 'Temporada Regular',
  playoffs: 'Playoffs',
  offseason: 'Entressafra',
}

function formatBudget(value: number): string {
  if (value >= 1_000_000) {
    return `€ ${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `€ ${(value / 1_000).toFixed(0)}K`
  }
  return `€ ${value.toLocaleString()}`
}

interface HeaderProps {
  onSave: () => void
}

export function Header({ onSave }: HeaderProps) {
  const managedTeamId = useGameStore(s => s.managedTeamId)
  const currentDay = useGameStore(s => s.currentDay)
  const seasonPhase = useGameStore(s => s.seasonPhase)
  const budget = useGameStore(s => s.budget)
  const isLoading = useGameStore(s => s.isLoading)

  const phaseLabel = PHASE_LABELS[seasonPhase] ?? seasonPhase

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <span className="text-gray-100 font-semibold">
          {managedTeamId ?? 'Sem equipa'}
        </span>
        <span className="text-gray-400 text-sm">
          Dia {currentDay} — {phaseLabel}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-green-400 font-mono font-semibold text-sm">
          {formatBudget(budget)}
        </span>
        <button
          onClick={onSave}
          disabled={isLoading || !managedTeamId}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
        >
          Guardar
        </button>
      </div>
    </header>
  )
}
