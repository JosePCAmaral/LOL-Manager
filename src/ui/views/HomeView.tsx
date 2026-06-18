import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { saveRepository } from '../../persistence'
import type { SaveSlot } from '../../persistence/db'

export function HomeView() {
  const navigateTo = useGameStore(s => s.navigateTo)
  const loadGame = useGameStore(s => s.loadGame)
  const isLoading = useGameStore(s => s.isLoading)

  const [saves, setSaves] = useState<SaveSlot[]>([])
  const [loadingSaves, setLoadingSaves] = useState(true)

  useEffect(() => {
    setLoadingSaves(true)
    saveRepository.listSaveSlots()
      .then(slots => setSaves(slots))
      .catch(() => setSaves([]))
      .finally(() => setLoadingSaves(false))
  }, [])

  const mostRecent = saves.length > 0
    ? saves.sort((a, b) => b.updatedAt - a.updatedAt)[0]
    : null

  async function handleContinue() {
    if (!mostRecent) return
    await loadGame(mostRecent.id)
    navigateTo('dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-10">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-blue-400 tracking-tight mb-3">
            LoL Manager
          </h1>
          <p className="text-gray-400 text-lg">Gere a tua organização de esports</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => navigateTo('newgame')}
            className="w-64 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base rounded-lg transition-colors shadow-lg"
          >
            Novo Jogo
          </button>

          <button
            onClick={() => void handleContinue()}
            disabled={!mostRecent || isLoading || loadingSaves}
            className="w-64 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base rounded-lg transition-colors shadow-lg"
          >
            {isLoading ? 'A carregar...' : 'Continuar'}
          </button>

          <button
            onClick={() => navigateTo('saves')}
            className="w-64 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-base rounded-lg transition-colors shadow-lg border border-gray-700"
          >
            Carregar Jogo
          </button>
        </div>

        {/* Version */}
        <p className="text-gray-600 text-sm">Versão 0.1.0 — Alpha</p>
      </div>
    </div>
  )
}
