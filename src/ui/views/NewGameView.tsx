import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { SEED_LEAGUES } from '../../data/seed/leagues'
import { SEED_TEAMS } from '../../data/seed/teams'
import { saveRepository } from '../../persistence'
import type { SaveSlot } from '../../persistence/db'

type Difficulty = 'easy' | 'normal' | 'hard'
type SlotId = 'save-1' | 'save-2' | 'save-3'

const SLOT_IDS: SlotId[] = ['save-1', 'save-2', 'save-3']

const DIFFICULTY_INFO: Record<Difficulty, { label: string; desc: string; sub: string }> = {
  easy: {
    label: 'Facil',
    desc: 'Budget+',
    sub: 'Scout+',
  },
  normal: {
    label: 'Normal',
    desc: 'Equilibrado',
    sub: '',
  },
  hard: {
    label: 'Dificil',
    desc: 'Budget-',
    sub: 'Scout-',
  },
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              n < current
                ? 'bg-blue-600 text-white'
                : n === current
                ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {n < current ? '✓' : n}
          </div>
          {n < total && <div className="w-8 h-px bg-gray-700" />}
        </div>
      ))}
    </div>
  )
}

export function NewGameView() {
  const navigateTo = useGameStore(s => s.navigateTo)
  const initNewGame = useGameStore(s => s.initNewGame)
  const isLoading = useGameStore(s => s.isLoading)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [slotId, setSlotId] = useState<SlotId>('save-1')
  const [saveName, setSaveName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const [existingSlots, setExistingSlots] = useState<Set<SlotId>>(new Set())

  useEffect(() => {
    saveRepository.listSaveSlots().then(saves => {
      const used = new Set(saves.map(s => s.id as SlotId))
      setExistingSlots(used)
    }).catch(() => {})
  }, [])

  const selectedLeague = SEED_LEAGUES.find(l => l.id === selectedLeagueId) ?? null
  const teamsInLeague = selectedLeague
    ? SEED_TEAMS.filter(t => selectedLeague.teamIds.includes(t.id))
    : []

  const selectedTeam = SEED_TEAMS.find(t => t.id === selectedTeamId) ?? null

  // Difficulty label for team: high reputation = harder (more expectations)
  function teamDifficultyLabel(reputation: number): string {
    if (reputation >= 85) return '★★★'
    if (reputation >= 70) return '★★'
    return '★'
  }

  async function handleStartGame() {
    if (!selectedTeamId) return
    await initNewGame(selectedTeamId, difficulty)
    navigateTo('dashboard')
  }

  const canProceedStep1 = saveName.trim().length > 0
  const canProceedStep2 = selectedLeagueId !== null
  const canStartGame = selectedTeamId !== null

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={() => navigateTo('home')}
            className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            Voltar
          </button>
          <h1 className="text-xl font-bold text-gray-100">Novo Jogo</h1>
          <StepIndicator current={step} total={3} />
        </div>

        {/* Step 1 — Config */}
        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-100">Configuração</h2>

            {/* Save name */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Nome do save</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="Ex: Minha Corrida"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Slot */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Slot</label>
              <div className="flex gap-3">
                {SLOT_IDS.map((id, i) => (
                  <button
                    key={id}
                    onClick={() => setSlotId(id)}
                    className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${
                      slotId === id
                        ? 'bg-blue-700 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    Save {i + 1}
                    {existingSlots.has(id) && (
                      <span className="block text-xs text-yellow-400 font-normal mt-0.5">em uso</span>
                    )}
                  </button>
                ))}
              </div>
              {existingSlots.has(slotId) && (
                <p className="text-yellow-500 text-xs mt-2">
                  Este slot já tem dados — serão apagados ao iniciar o jogo.
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">Dificuldade</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(DIFFICULTY_INFO) as [Difficulty, typeof DIFFICULTY_INFO[Difficulty]][]).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`p-4 rounded border text-left transition-colors ${
                      difficulty === key
                        ? 'bg-blue-700/30 border-blue-500 text-blue-100'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold mb-1">{info.label}</div>
                    <div className="text-xs text-gray-400">{info.desc}</div>
                    {info.sub && <div className="text-xs text-gray-400">{info.sub}</div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
              >
                Proximo
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Region */}
        {step === 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-100">Escolhe a liga onde queres competir</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SEED_LEAGUES.map(league => {
                const isSelected = selectedLeagueId === league.id
                return (
                  <button
                    key={league.id}
                    onClick={() => {
                      setSelectedLeagueId(league.id)
                      setSelectedTeamId(null)
                    }}
                    className={`p-4 rounded border text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-700/30 border-blue-500 text-blue-100'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-sm">{league.region}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{league.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{league.teamIds.length} times</div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
              >
                Proximo
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Team */}
        {step === 3 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Escolhe o teu time</h2>
              {selectedLeague && (
                <p className="text-gray-400 text-sm mt-0.5">
                  Liga: {selectedLeague.region} — {selectedLeague.name}
                </p>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {teamsInLeague.map(team => {
                const isSelected = selectedTeamId === team.id
                return (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`w-full text-left p-4 rounded border transition-colors ${
                      isSelected
                        ? 'bg-blue-700/20 border-blue-500'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-100">{team.name}</span>
                      <span className="text-yellow-400 text-sm">
                        Reputação: {team.reputation}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>Budget: € {team.budget.toLocaleString('pt-PT')}</span>
                      <span>Dificuldade: {teamDifficultyLabel(team.reputation)}</span>
                      <span>Instalações: Nível {team.facilityLevel}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => void handleStartGame()}
                disabled={!canStartGame || isLoading}
                className="px-6 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
              >
                {isLoading ? 'A iniciar...' : 'Iniciar Jogo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
