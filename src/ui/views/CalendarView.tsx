import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { DayActivityType, DayActivity } from '@engine/calendar/calendar'
import type { SeasonPhase } from '@engine/calendar/season'

const ACTIVITY_ICONS: Record<DayActivityType, string> = {
  match: '⚔',
  scrim: '🤝',
  general_training: '💪',
  champion_training: '🎯',
  rest: '😴',
  special_event: '⭐',
  offseason: '🏖',
}

const ACTIVITY_LABELS: Record<DayActivityType, string> = {
  match: 'Jogo',
  scrim: 'Scrim',
  general_training: 'Treino Geral',
  champion_training: 'Treino Campeao',
  rest: 'Descanso',
  special_event: 'Evento Especial',
  offseason: 'Entressafra',
}

const ACTIVITY_BG: Record<DayActivityType, string> = {
  match: 'bg-red-900/40 border-red-600',
  scrim: 'bg-purple-900/60 border-purple-700',
  general_training: 'bg-blue-900/60 border-blue-700',
  champion_training: 'bg-indigo-900/60 border-indigo-700',
  rest: 'bg-green-900/60 border-green-700',
  special_event: 'bg-yellow-900/60 border-yellow-700',
  offseason: 'bg-gray-800/60 border-gray-700',
}

const PHASE_COLORS: Record<SeasonPhase, string> = {
  preseason: 'bg-gray-600 text-gray-200',
  regularSeason: 'bg-blue-700 text-blue-100',
  playoffs: 'bg-yellow-700 text-yellow-100',
  offseason: 'bg-green-800 text-green-200',
}

const PHASE_LABELS: Record<SeasonPhase, string> = {
  preseason: 'Pre-Temporada',
  regularSeason: 'Temporada Regular',
  playoffs: 'Playoffs',
  offseason: 'Entressafra',
}

function getMonth(day: number) {
  return Math.ceil(day / 30)
}

function getMonthRange(month: number): [number, number] {
  const start = (month - 1) * 30 + 1
  const end = month * 30
  return [start, end]
}

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Extra',
]

const SETTABLE_ACTIVITIES: { type: DayActivityType; label: string; icon: string }[] = [
  { type: 'general_training', label: 'Treino Geral', icon: '💪' },
  { type: 'champion_training', label: 'Treino Campeao', icon: '🎯' },
  { type: 'scrim', label: 'Scrimmage', icon: '🤝' },
  { type: 'rest', label: 'Descanso', icon: '😴' },
]

export function CalendarView() {
  const calendar = useGameStore(s => s.calendar)
  const currentDay = useGameStore(s => s.currentDay)
  const currentYear = useGameStore(s => s.currentYear)
  const seasonPhase = useGameStore(s => s.seasonPhase)
  const advanceDay = useGameStore(s => s.advanceDay)
  const advanceToNextMatch = useGameStore(s => s.advanceToNextMatch)
  const setDayActivity = useGameStore(s => s.setDayActivity)
  const isLoading = useGameStore(s => s.isLoading)

  const [viewMonth, setViewMonth] = useState<number>(getMonth(currentDay))
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [start, end] = getMonthRange(viewMonth)
  const monthDays = calendar.filter(
    d => d.date.year === currentYear && d.date.dayOfYear >= start && d.date.dayOfYear <= end,
  )

  const firstDayIndex = (start - 1) % 7

  const selectedCalDay = selectedDay !== null
    ? calendar.find(d => d.date.year === currentYear && d.date.dayOfYear === selectedDay)
    : null

  const isMatchDay = (day: number) => {
    const calDay = calendar.find(d => d.date.year === currentYear && d.date.dayOfYear === day)
    return calDay?.activity.type === 'match'
  }

  const isFuture = (day: number) => day > currentDay
  const isPast = (day: number) => day < currentDay

  function handleDayClick(day: number) {
    if (isMatchDay(day)) return // match days are not selectable
    setSelectedDay(prev => (prev === day ? null : day))
  }

  function handleSetActivity(type: DayActivityType) {
    if (selectedDay === null || !isFuture(selectedDay)) return
    const activity: DayActivity = { type }
    setDayActivity(selectedDay, activity)
  }

  return (
    <div className="p-6 flex gap-6">
      {/* Main calendar area */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Calendario</h1>
            <p className="text-gray-400 mt-1">
              Ano {currentYear} · Dia {currentDay} —{' '}
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${PHASE_COLORS[seasonPhase]}`}>
                {PHASE_LABELS[seasonPhase]}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void advanceDay()}
              disabled={isLoading}
              className="px-3 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded text-sm transition-colors"
            >
              +1 Dia
            </button>
            <button
              onClick={() => void advanceToNextMatch()}
              disabled={isLoading}
              className="px-3 py-2 bg-orange-700 hover:bg-orange-600 disabled:opacity-50 text-white rounded text-sm transition-colors"
            >
              ⚔ Ir para proximo jogo
            </button>
          </div>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.entries(PHASE_LABELS) as [SeasonPhase, string][]).map(([phase, label]) => (
            <span key={phase} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PHASE_COLORS[phase]}`}>
              {label}
            </span>
          ))}
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setViewMonth(m => Math.max(1, m - 1))}
            disabled={viewMonth <= 1}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-200 rounded text-sm"
          >
            Mes Anterior
          </button>
          <span className="text-gray-200 font-semibold">
            {MONTH_NAMES[viewMonth] ?? `Mes ${viewMonth}`} (Dias {start}–{end})
          </span>
          <button
            onClick={() => setViewMonth(m => Math.min(13, m + 1))}
            disabled={viewMonth >= 13}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-200 rounded text-sm"
          >
            Proximo Mes
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {monthDays.map(day => {
            const d = day.date.dayOfYear
            const isToday = d === currentDay
            const isMatch = day.activity.type === 'match'
            const bgColor = ACTIVITY_BG[day.activity.type] ?? ACTIVITY_BG.offseason
            const isSelected = d === selectedDay
            const past = isPast(d)

            return (
              <button
                key={d}
                onClick={() => handleDayClick(d)}
                disabled={isMatch || past}
                className={`
                  relative flex flex-col items-center justify-start p-1 rounded border min-h-[52px] text-left transition-all
                  ${bgColor}
                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                  ${isSelected ? 'ring-2 ring-white/60' : ''}
                  ${past ? 'opacity-40 cursor-default' : isMatch ? 'cursor-default' : 'hover:brightness-125'}
                `}
              >
                <span className={`text-xs font-mono font-semibold ${isToday ? 'text-blue-300' : 'text-gray-300'}`}>
                  {d}
                </span>
                <span className="text-base mt-0.5">{ACTIVITY_ICONS[day.activity.type]}</span>
                {isMatch && (
                  <span className="text-[9px] text-red-400 font-bold">JOGO</span>
                )}
                {isToday && (
                  <span className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] text-blue-300 font-bold">HOJE</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Activity legend */}
        <div className="mt-5 flex flex-wrap gap-3">
          {(Object.entries(ACTIVITY_ICONS) as [DayActivityType, string][]).map(([type, icon]) => (
            <div key={type} className="flex items-center gap-1 text-xs text-gray-400">
              <span>{icon}</span>
              <span>{ACTIVITY_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel — only for future non-match days */}
      <div className="w-64 shrink-0">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          {selectedDay === null ? (
            <div className="text-gray-500 text-sm text-center py-8">
              Clica num dia futuro para definir a actividade.
            </div>
          ) : isMatchDay(selectedDay) ? (
            <div className="text-gray-500 text-sm text-center py-8">
              Dia de jogo — a actividade e obrigatoria.
            </div>
          ) : (
            <>
              <h3 className="text-gray-100 font-semibold mb-1">Dia {selectedDay}</h3>
              {selectedCalDay && (
                <p className="text-gray-400 text-sm mb-4">
                  {ACTIVITY_ICONS[selectedCalDay.activity.type]}{' '}
                  {ACTIVITY_LABELS[selectedCalDay.activity.type]}
                </p>
              )}

              {isFuture(selectedDay) ? (
                <>
                  <p className="text-xs text-gray-500 mb-3">Definir actividade:</p>
                  <div className="space-y-2">
                    {SETTABLE_ACTIVITIES.map(a => (
                      <button
                        key={a.type}
                        onClick={() => handleSetActivity(a.type)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors ${
                          selectedCalDay?.activity.type === a.type
                            ? 'bg-blue-800 border-blue-600 text-blue-100'
                            : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                        }`}
                      >
                        <span>{a.icon}</span>
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500">Dia passado — nao pode ser alterado.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
