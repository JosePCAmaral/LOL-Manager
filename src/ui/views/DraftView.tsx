import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../store/useGameStore'
import type { Champion, Role } from '../../types'
import type { DraftState, DraftSlot } from '../../engine/draft/draftEngine'
import type { DraftResult } from '../../types'
import { getChampionScore, computeContribuicaoComp } from '../../engine/draft/composition'
import { seededRandom } from '../../engine/core/rng'

// ---------------------------------------------------------------------------
// Role ordering for display
// ---------------------------------------------------------------------------
const ROLES: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

// ---------------------------------------------------------------------------
// Slot grouping helpers
// ---------------------------------------------------------------------------
// Indices per phase:
// ban1:  0-5, pick1: 6-11, ban2: 12-15, pick2: 16-19
const PHASE_RANGES = {
  ban1:  [0, 5],
  pick1: [6, 11],
  ban2:  [12, 15],
  pick2: [16, 19],
} as const

// ---------------------------------------------------------------------------
// TurnIndicator
// ---------------------------------------------------------------------------
function TurnIndicator({ state }: { state: DraftState }) {
  const finished = state.finished || state.currentSlotIndex >= state.slots.length
  if (finished) {
    return (
      <div className="p-3 text-center font-bold bg-green-900 text-green-200 text-sm">
        Draft Concluido — Todas as escolhas foram feitas
      </div>
    )
  }
  const slot = state.slots[state.currentSlotIndex]
  const isBlueTurn = slot.team === 'blue'
  const action = slot.action === 'ban' ? 'BAN' : 'PICK'
  const phaseLabel = slot.phase.toUpperCase()

  return (
    <div className={`p-3 text-center font-bold text-sm ${isBlueTurn ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'}`}>
      {isBlueTurn ? 'BLUE' : 'RED'} — {action} — {phaseLabel} — Slot {state.currentSlotIndex + 1}/20
    </div>
  )
}

// ---------------------------------------------------------------------------
// SlotCell — one slot in the draft board
// ---------------------------------------------------------------------------
function SlotCell({
  slot,
  index,
  currentIndex,
  allChampions,
}: {
  slot: DraftSlot
  index: number
  currentIndex: number
  allChampions: Champion[]
}) {
  const isFilled = slot.championId !== null
  const isActive = index === currentIndex
  const isPast = index < currentIndex
  const isBan = slot.action === 'ban'
  const isBlue = slot.team === 'blue'

  const champion = isFilled ? allChampions.find(c => c.id === slot.championId) : null

  let cellClass =
    'w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 overflow-hidden select-none '

  if (isActive) {
    cellClass += isBlue
      ? 'border-blue-400 bg-blue-950 animate-pulse shadow-lg shadow-blue-800'
      : 'border-red-400 bg-red-950 animate-pulse shadow-lg shadow-red-800'
  } else if (isFilled) {
    if (isBan) {
      cellClass += isBlue
        ? 'border-blue-700 bg-blue-950/60 opacity-80'
        : 'border-red-700 bg-red-950/60 opacity-80'
    } else {
      cellClass += isBlue
        ? 'border-blue-500 bg-blue-900/70'
        : 'border-red-500 bg-red-900/70'
    }
  } else if (isPast) {
    cellClass += 'border-gray-700 bg-gray-800 opacity-40'
  } else {
    cellClass += 'border-dashed border-gray-600 bg-gray-900 opacity-40'
  }

  return (
    <div className={cellClass}>
      {isFilled && champion ? (
        <>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-0.5 ${isBan ? 'bg-gray-700 line-through' : isBlue ? 'bg-blue-700' : 'bg-red-700'}`}>
            {champion.name[0]}
          </div>
          <span className="truncate w-full text-center text-[10px] px-0.5 leading-tight">
            {champion.name.length > 8 ? champion.name.slice(0, 7) + '…' : champion.name}
          </span>
          {isBan && <span className="text-red-400 text-[10px]">BAN</span>}
        </>
      ) : (
        <>
          <div className={`w-6 h-6 rounded-full border border-dashed mb-0.5 ${isActive ? (isBlue ? 'border-blue-400' : 'border-red-400') : 'border-gray-600'}`} />
          {slot.role && (
            <span className="text-[10px] text-gray-500">{slot.role === 'JUNGLE' ? 'JGL' : slot.role === 'SUPPORT' ? 'SUP' : slot.role}</span>
          )}
          {isBan && !slot.role && (
            <span className="text-[10px] text-gray-600">ban</span>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraftBoard — central board showing all 20 slots grouped by phase
// ---------------------------------------------------------------------------
function DraftBoard({ state, allChampions }: { state: DraftState; allChampions: Champion[] }) {
  const phases: Array<{ label: string; range: [number, number] }> = [
    { label: 'Ban Phase 1', range: [0, 5] },
    { label: 'Pick Phase 1', range: [6, 11] },
    { label: 'Ban Phase 2', range: [12, 15] },
    { label: 'Pick Phase 2', range: [16, 19] },
  ]

  return (
    <div className="flex flex-col gap-4">
      {phases.map(({ label, range }) => {
        const [start, end] = range
        const phaseSlots = state.slots.slice(start, end + 1)
        return (
          <div key={label}>
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
            <div className="flex gap-2 flex-wrap">
              {phaseSlots.map((slot, i) => (
                <SlotCell
                  key={start + i}
                  slot={slot}
                  index={start + i}
                  currentIndex={state.currentSlotIndex}
                  allChampions={allChampions}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TeamPanel — side panel for blue or red
// ---------------------------------------------------------------------------
function TeamPanel({
  side,
  state,
  allChampions,
}: {
  side: 'blue' | 'red'
  state: DraftState
  allChampions: Champion[]
}) {
  const bans = side === 'blue' ? state.blueBans : state.redBans
  const picks = side === 'blue' ? state.bluePicks : state.redPicks
  const isBlue = side === 'blue'
  const borderColor = isBlue ? 'border-blue-800' : 'border-red-800'
  const headerColor = isBlue ? 'text-blue-400' : 'text-red-400'
  const teamLabel = isBlue ? 'Blue Team' : 'Red Team'

  // Determine how many ban slots exist for this side in the sequence
  const banSlots = state.slots.filter(s => s.team === side && s.action === 'ban')
  const maxBans = banSlots.length // should be 5

  const resolveChampion = (id: string | undefined) =>
    id ? allChampions.find(c => c.id === id) : undefined

  return (
    <div className={`flex flex-col gap-3 p-3 bg-gray-900 border ${borderColor} rounded-lg min-w-[150px]`}>
      <h3 className={`text-sm font-bold ${headerColor}`}>{teamLabel}</h3>

      {/* Bans */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase mb-1">Bans</p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: maxBans }).map((_, i) => {
            const bannedId = bans[i]
            const champ = resolveChampion(bannedId)
            return (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                  champ
                    ? 'bg-gray-700 border-gray-500 text-gray-300 line-through'
                    : 'border-dashed border-gray-600 bg-gray-800 text-gray-600'
                }`}
                title={champ?.name ?? 'Empty ban'}
              >
                {champ ? champ.name[0] : '?'}
              </div>
            )
          })}
        </div>
      </div>

      {/* Picks by role */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase mb-1">Picks</p>
        <div className="flex flex-col gap-1">
          {ROLES.map(role => {
            const pickedId = picks[role]
            const champ = resolveChampion(pickedId)
            const roleShort = role === 'JUNGLE' ? 'JGL' : role === 'SUPPORT' ? 'SUP' : role
            return (
              <div key={role} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-7 shrink-0">{roleShort}</span>
                <div
                  className={`flex-1 h-7 rounded flex items-center px-2 text-xs font-medium ${
                    champ
                      ? isBlue ? 'bg-blue-900 text-blue-200' : 'bg-red-900 text-red-200'
                      : 'bg-gray-800 text-gray-600 border border-dashed border-gray-700'
                  }`}
                >
                  {champ ? champ.name : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AISuggestions — suggestions panel for blue pick turns
// ---------------------------------------------------------------------------
function AISuggestions({
  draftState,
  players,
  allChampions,
  onSelect,
}: {
  draftState: DraftState
  players: ReturnType<typeof useGameStore>['players']
  allChampions: Champion[]
  onSelect: (championId: string) => void
}) {
  const slot = draftState.slots[draftState.currentSlotIndex]
  if (!slot || slot.action !== 'pick' || slot.team !== 'blue') return null

  const role = slot.role as Role
  const allBanned = [...draftState.blueBans, ...draftState.redBans]
  const allPicked = [
    ...Object.values(draftState.bluePicks).filter((v): v is string => v !== undefined),
    ...Object.values(draftState.redPicks).filter((v): v is string => v !== undefined),
  ]
  const excluded = new Set([...allBanned, ...allPicked])
  const available = allChampions.filter(c => !excluded.has(c.id) && c.eligibleRoles.includes(role))

  const player = players.find(p => p.role === role && p.isStarter)
  const teammateChampions = Object.values(draftState.bluePicks)
    .filter((id): id is string => id !== undefined)
    .map(id => allChampions.find(c => c.id === id))
    .filter((c): c is Champion => c !== undefined)

  const scored = available
    .map(champ => {
      const score = player
        ? getChampionScore(player, champ, teammateChampions)
        : computeContribuicaoComp(champ, teammateChampions)
      return { champ, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (scored.length === 0) return null

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 border-t border-gray-700">
      <span className="text-yellow-400 font-bold text-sm shrink-0">Sugestoes IA ({role}):</span>
      <div className="flex gap-2">
        {scored.map(({ champ, score }) => (
          <button
            key={champ.id}
            onClick={() => onSelect(champ.id)}
            className="flex flex-col items-center p-2 bg-gray-800 hover:bg-blue-900 rounded-lg border border-gray-600 hover:border-blue-400 transition-colors min-w-[80px]"
          >
            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-sm font-bold mb-1">
              {champ.name[0]}
            </div>
            <span className="text-xs font-medium text-gray-200">{champ.name}</span>
            <span className="text-[10px] text-gray-400">Score: {(score * 10).toFixed(1)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Suggestion for ban turn (blue side)
function BanHint({ draftState }: { draftState: DraftState }) {
  const slot = draftState.slots[draftState.currentSlotIndex]
  if (!slot || slot.action !== 'ban' || slot.team !== 'blue') return null

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 border-t border-gray-700">
      <span className="text-orange-400 font-bold text-sm">Sua vez de BANIR:</span>
      <span className="text-gray-400 text-sm">Escolhe um campeao para remover do draft. Considera banir os campeoes mais fortes do adversario.</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChampionPool — bottom grid
// ---------------------------------------------------------------------------
function ChampionPool({
  allChampions,
  draftState,
  search,
  roleFilter,
  onSelect,
}: {
  allChampions: Champion[]
  draftState: DraftState
  search: string
  roleFilter: Role | 'ALL'
  onSelect: (championId: string) => void
}) {
  const slot = draftState.slots[draftState.currentSlotIndex]
  if (!slot) return null
  if (slot.team !== 'blue') return null

  const allUsed = new Set([
    ...draftState.blueBans, ...draftState.redBans,
    ...Object.values(draftState.bluePicks).filter((v): v is string => v !== undefined),
    ...Object.values(draftState.redPicks).filter((v): v is string => v !== undefined),
  ])

  const available = allChampions.filter(c => !allUsed.has(c.id))
  const filtered = available
    .filter(c => search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
    .filter(c => roleFilter === 'ALL' || c.eligibleRoles.includes(roleFilter))

  return (
    <div className="overflow-y-auto max-h-52">
      <div className="grid grid-cols-8 gap-1.5 p-3">
        {filtered.map(champ => (
          <button
            key={champ.id}
            onClick={() => onSelect(champ.id)}
            className="flex flex-col items-center p-1.5 bg-gray-800 hover:bg-blue-900 rounded border border-gray-700 hover:border-blue-500 transition-colors text-xs"
            title={champ.name}
          >
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-base font-bold mb-0.5">
              {champ.name[0]}
            </div>
            <span className="truncate w-full text-center text-[10px] leading-tight">{champ.name}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-8 text-center text-gray-500 py-4 text-sm">
            Nenhum campeao encontrado
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraftResultScreen
// ---------------------------------------------------------------------------
function DraftResultScreen({
  result,
  allChampions,
  onReset,
}: {
  result: DraftResult
  allChampions: Champion[]
  onReset: () => void
}) {
  const resolveChampName = (id: string) => allChampions.find(c => c.id === id)?.name ?? id

  const bluePicks = result.picks['blue'] as Record<Role, string> | undefined
  const redPicks = result.picks['red'] as Record<Role, string> | undefined
  const blueBans = result.bans['blue'] ?? []
  const redBans = result.bans['red'] ?? []

  return (
    <div className="p-6 flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-100">Draft Concluido!</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-blue-800 rounded-lg p-4">
          <h3 className="text-blue-400 font-bold text-lg mb-3">Blue Team</h3>
          <p className="text-xs text-gray-500 mb-1 uppercase">Bans</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {blueBans.map(id => (
              <span key={id} className="text-xs bg-gray-700 text-gray-400 rounded px-2 py-0.5 line-through">{resolveChampName(id)}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-1 uppercase">Picks</p>
          <div className="flex flex-col gap-1">
            {ROLES.map(role => {
              const champId = bluePicks?.[role]
              return (
                <div key={role} className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500 w-8">{role === 'JUNGLE' ? 'JGL' : role === 'SUPPORT' ? 'SUP' : role}</span>
                  <span className="text-sm text-blue-200 font-medium">{champId ? resolveChampName(champId) : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bg-gray-900 border border-red-800 rounded-lg p-4">
          <h3 className="text-red-400 font-bold text-lg mb-3">Red Team</h3>
          <p className="text-xs text-gray-500 mb-1 uppercase">Bans</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {redBans.map(id => (
              <span key={id} className="text-xs bg-gray-700 text-gray-400 rounded px-2 py-0.5 line-through">{resolveChampName(id)}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mb-1 uppercase">Picks</p>
          <div className="flex flex-col gap-1">
            {ROLES.map(role => {
              const champId = redPicks?.[role]
              return (
                <div key={role} className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500 w-8">{role === 'JUNGLE' ? 'JGL' : role === 'SUPPORT' ? 'SUP' : role}</span>
                  <span className="text-sm text-red-200 font-medium">{champId ? resolveChampName(champId) : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
        >
          Novo Draft
        </button>
        <button
          className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          Ir para Partida
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PreDraftScreen
// ---------------------------------------------------------------------------
function PreDraftScreen({
  players,
  allChampions,
  onStart,
  onAutoDraft,
}: {
  players: ReturnType<typeof useGameStore>['players']
  allChampions: Champion[]
  onStart: () => void
  onAutoDraft: () => void
}) {
  const starters = players.filter(p => p.isStarter)
  const missingCount = 5 - starters.length

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Preparar Draft</h2>
        <p className="text-gray-400">O teu time jogara pelo lado Blue. A IA controlara o lado Red.</p>
      </div>
      {missingCount > 0 && (
        <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm">
          Aviso: {missingCount} posicao(oes) sem titular definido. Os picks serao baseados em composicao.
        </div>
      )}
      <div className="flex gap-4">
        <button
          onClick={onStart}
          disabled={allChampions.length === 0}
          className="px-6 py-3 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold transition-colors"
        >
          Iniciar Draft (Manual)
        </button>
        <button
          onClick={onAutoDraft}
          disabled={allChampions.length === 0}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-200 rounded-lg font-semibold transition-colors"
        >
          Auto-Draft (IA faz tudo)
        </button>
      </div>
      {allChampions.length === 0 && (
        <p className="text-gray-500 text-sm">A carregar campeoes...</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DraftView — main component
// ---------------------------------------------------------------------------
export function DraftView() {
  const draftState   = useGameStore(s => s.draftState)
  const draftResult  = useGameStore(s => s.draftResult)
  const allChampions = useGameStore(s => s.allChampions)
  const players      = useGameStore(s => s.players)

  const startDraft      = useGameStore(s => s.startDraft)
  const applyAction     = useGameStore(s => s.applyDraftAction)
  const runAutoDraftFn  = useGameStore(s => s.runAutoDraft)
  const resetDraft      = useGameStore(s => s.resetDraft)
  const loadChampions   = useGameStore(s => s.loadChampions)

  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')

  // Load champions on mount if not already loaded
  useEffect(() => {
    if (allChampions.length === 0) {
      void loadChampions()
    }
  }, [allChampions.length, loadChampions])

  // AI auto-action for Red slots
  useEffect(() => {
    if (!draftState || draftState.finished) return
    const slot = draftState.slots[draftState.currentSlotIndex]
    if (!slot || slot.team !== 'red') return

    // Slight delay so user can see AI action
    const timer = setTimeout(() => {
      const allBanned = [...draftState.blueBans, ...draftState.redBans]
      const allPicked = [
        ...Object.values(draftState.bluePicks).filter((v): v is string => v !== undefined),
        ...Object.values(draftState.redPicks).filter((v): v is string => v !== undefined),
      ]
      const allUsed = new Set([...allBanned, ...allPicked])

      let championId: string | undefined

      if (slot.action === 'ban') {
        // suggestBan needs enemy players (blue side) — we use our players
        try {
          const rng = seededRandom(`ai-ban-${draftState.currentSlotIndex}`)
          championId = suggestBan('red', draftState, players, allChampions, rng)
        } catch {
          // fallback: pick first available
          const available = allChampions.filter(c => !allUsed.has(c.id))
          if (available.length > 0) championId = available[0].id
        }
      } else {
        // pick — use composition-aware scoring via getChampionScore fallback
        const role = slot.role as Role
        const available = allChampions.filter(
          c => !allUsed.has(c.id) && c.eligibleRoles.includes(role)
        )
        if (available.length === 0) {
          // fallback: any champion not used
          const fallback = allChampions.filter(c => !allUsed.has(c.id))
          if (fallback.length > 0) championId = fallback[0].id
        } else {
          const teammateChampions = Object.values(draftState.redPicks)
            .filter((id): id is string => id !== undefined)
            .map(id => allChampions.find(c => c.id === id))
            .filter((c): c is Champion => c !== undefined)

          const scored = available
            .map(champ => ({ champ, score: computeContribuicaoComp(champ, teammateChampions) }))
            .sort((a, b) => b.score - a.score)

          if (scored.length > 0) championId = scored[0].champ.id
        }
      }

      if (championId) {
        applyAction(championId)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [draftState, allChampions, players, applyAction])

  const handleChampionSelect = useCallback((championId: string) => {
    if (!draftState || draftState.finished) return
    const slot = draftState.slots[draftState.currentSlotIndex]
    if (!slot || slot.team !== 'blue') return
    applyAction(championId)
  }, [draftState, applyAction])

  const starters = players.filter(p => p.isStarter)

  const handleStart = () => {
    startDraft(starters, [])
  }

  const handleAutoDraft = () => {
    runAutoDraftFn(starters, [])
  }

  // Result screen
  if (draftResult) {
    return (
      <div className="h-full overflow-auto">
        <DraftResultScreen
          result={draftResult}
          allChampions={allChampions}
          onReset={resetDraft}
        />
      </div>
    )
  }

  // Pre-draft screen
  if (!draftState) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-gray-100">Draft</h1>
          <p className="text-gray-500 text-sm">Fase de ban/pick antes da partida</p>
        </div>
        <PreDraftScreen
          players={players}
          allChampions={allChampions}
          onStart={handleStart}
          onAutoDraft={handleAutoDraft}
        />
      </div>
    )
  }

  // Main draft screen
  const currentSlot = draftState.finished
    ? null
    : draftState.slots[draftState.currentSlotIndex]
  const isBluePickTurn = currentSlot?.team === 'blue' && currentSlot?.action === 'pick'
  const isBlueBanTurn  = currentSlot?.team === 'blue' && currentSlot?.action === 'ban'
  const isBlueTurn = isBluePickTurn || isBlueBanTurn

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Turn indicator */}
      <TurnIndicator state={draftState} />

      {/* Main content: side panels + central board */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden min-h-0">
        {/* Blue team panel */}
        <div className="shrink-0">
          <TeamPanel side="blue" state={draftState} allChampions={allChampions} />
        </div>

        {/* Central board */}
        <div className="flex-1 overflow-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 h-full">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Draft Board</p>
            <DraftBoard state={draftState} allChampions={allChampions} />
          </div>
        </div>

        {/* Red team panel */}
        <div className="shrink-0">
          <TeamPanel side="red" state={draftState} allChampions={allChampions} />
        </div>
      </div>

      {/* Bottom section: suggestions + filters + champion pool */}
      <div className="border-t border-gray-800 flex flex-col">
        {/* AI suggestions or ban hint */}
        {!draftState.finished && (
          <>
            {isBluePickTurn && (
              <AISuggestions
                draftState={draftState}
                players={players}
                allChampions={allChampions}
                onSelect={handleChampionSelect}
              />
            )}
            {isBlueBanTurn && (
              <BanHint draftState={draftState} />
            )}
            {!isBlueTurn && (
              <div className="flex items-center gap-2 p-3 bg-gray-900 border-t border-gray-700">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-gray-400 text-sm">IA a pensar...</span>
              </div>
            )}
          </>
        )}

        {/* Filter bar — only show on blue turns */}
        {isBlueTurn && !draftState.finished && (
          <>
            <div className="flex gap-2 px-3 py-2 bg-gray-950 border-t border-gray-800">
              <input
                type="text"
                placeholder="Pesquisar campeao..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-1">
                {(['ALL', 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      roleFilter === r
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {r === 'JUNGLE' ? 'JGL' : r === 'SUPPORT' ? 'SUP' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Champion grid */}
            <ChampionPool
              allChampions={allChampions}
              draftState={draftState}
              search={search}
              roleFilter={roleFilter}
              onSelect={handleChampionSelect}
            />
          </>
        )}
      </div>
    </div>
  )
}
