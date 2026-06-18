import { useGameStore } from '../../store/useGameStore'

export function LoadingOverlay() {
  const isLoading = useGameStore(s => s.isLoading)
  if (!isLoading) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-8 py-6 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-white text-sm">A carregar...</span>
      </div>
    </div>
  )
}
