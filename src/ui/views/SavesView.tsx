import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { saveRepository } from '../../persistence'
import type { SaveSlot } from '../../persistence/db'

const SLOT_IDS = ['save-1', 'save-2', 'save-3'] as const
type SlotId = typeof SLOT_IDS[number]

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return 'agora mesmo'
  if (diffMinutes < 60) return `há ${diffMinutes} min`
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`
}

export function SavesView() {
  const navigateTo = useGameStore(s => s.navigateTo)
  const loadGame = useGameStore(s => s.loadGame)
  const isLoading = useGameStore(s => s.isLoading)

  const [slots, setSlots] = useState<Record<SlotId, SaveSlot | null>>({
    'save-1': null,
    'save-2': null,
    'save-3': null,
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState<SlotId | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(true)

  function refreshSlots() {
    setLoadingSlots(true)
    saveRepository.listSaveSlots()
      .then(saves => {
        const map: Record<SlotId, SaveSlot | null> = {
          'save-1': null,
          'save-2': null,
          'save-3': null,
        }
        for (const s of saves) {
          if (s.id === 'save-1' || s.id === 'save-2' || s.id === 'save-3') {
            map[s.id] = s
          }
        }
        setSlots(map)
      })
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }

  useEffect(() => {
    refreshSlots()
  }, [])

  async function handleLoad(slotId: SlotId) {
    await loadGame(slotId)
    navigateTo('dashboard')
  }

  async function handleDelete(slotId: SlotId) {
    await saveRepository.deleteSaveSlot(slotId)
    setConfirmDeleteId(null)
    refreshSlots()
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigateTo('home')}
            className="text-gray-400 hover:text-gray-200 text-sm transition-colors"
          >
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-100">Carregar Jogo</h1>
        </div>

        {loadingSlots ? (
          <div className="text-gray-500 text-center py-10">A carregar saves...</div>
        ) : (
          <div className="space-y-4">
            {SLOT_IDS.map(slotId => {
              const save = slots[slotId]
              const isConfirmingDelete = confirmDeleteId === slotId

              return (
                <div
                  key={slotId}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-5"
                >
                  {save ? (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h2 className="text-gray-100 font-semibold text-lg">{save.name}</h2>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-400">
                            <span>Time: <span className="text-gray-200">{save.teamName}</span></span>
                            <span>|</span>
                            <span>Liga: <span className="text-gray-200">{save.leagueName}</span></span>
                            <span>|</span>
                            <span>Dia <span className="text-gray-200">{save.dayOfYear}</span></span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-400">
                            <span>Temporada <span className="text-gray-200">{save.seasonYear}</span></span>
                            <span>|</span>
                            <span className="text-green-400">{save.wins}V</span>
                            <span className="text-red-400">{save.losses}D</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            Última sessão: {formatRelativeTime(save.updatedAt)}
                          </p>
                        </div>
                      </div>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-red-400 text-sm flex-1">Tens a certeza? Esta acção não pode ser desfeita.</span>
                          <button
                            onClick={() => void handleDelete(slotId)}
                            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => void handleLoad(slotId)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
                          >
                            {isLoading ? 'A carregar...' : 'Carregar'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(slotId)}
                            className="px-4 py-2 bg-gray-800 hover:bg-red-900/60 text-gray-400 hover:text-red-300 text-sm rounded transition-colors"
                          >
                            Apagar
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 italic">— Vazio —</span>
                      <button
                        onClick={() => navigateTo('newgame')}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-sm rounded transition-colors"
                      >
                        Novo Jogo aqui
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
