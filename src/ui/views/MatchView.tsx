import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { MatchViewer } from '../../render'
import type { MatchResult, MatchEvent } from '../../types/index'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEvent(event: MatchEvent): string {
  switch (event.type) {
    case 'kill':
      return `Kill — ${event.killer} eliminou ${event.victim}`
    case 'towerDestroyed':
      return `Torre destruida (${event.lane})`
    case 'objective':
      return `Objectivo: ${event.objective}`
    case 'itemPurchase':
      return `Item: ${event.item}`
    case 'goldUpdate':
      return ''
    default:
      return (event as { type: string }).type
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type PlaybackState = 'idle' | 'playing' | 'paused' | 'ended'

interface PlaybackControlsProps {
  state: PlaybackState
  speed: number
  progress: number
  currentMinute: number
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSkipToEnd: () => void
  onSpeedChange: (s: number) => void
}

function PlaybackControls({
  state,
  speed,
  progress,
  currentMinute,
  onPlay,
  onPause,
  onReset,
  onSkipToEnd,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700 shrink-0">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onReset}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
          title="Reiniciar"
        >
          &#9198;
        </button>
        <button
          onClick={state === 'playing' ? onPause : onPlay}
          disabled={state === 'ended' || state === 'idle'}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded disabled:opacity-40 transition-colors min-w-24 text-sm font-medium"
        >
          {state === 'playing' ? 'Pausar' : 'Play'}
        </button>
        <button
          onClick={onSkipToEnd}
          disabled={state === 'ended' || state === 'idle'}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-40 transition-colors"
          title="Saltar para o fim"
        >
          &#9197;
        </button>

        {/* Progress bar */}
        <div className="flex-1 mx-2">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
        <span className="text-gray-400 text-sm min-w-16 text-right">
          {Math.round(progress * 100)}% · m{currentMinute}
        </span>
      </div>

      {/* Speed buttons */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Velocidade:</span>
        {[0.5, 1, 2, 4].map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              speed === s
                ? 'bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}

function EventLog({ events }: { events: Array<{ minute: number; text: string }> }) {
  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Eventos</h3>
      <div className="space-y-1 max-h-52 overflow-y-auto">
        {events.length === 0 && (
          <p className="text-gray-600 text-xs">Sem eventos ainda</p>
        )}
        {[...events].reverse().map((e, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className="text-gray-500 min-w-8 shrink-0">m{e.minute}</span>
            <span className="text-gray-300">{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchHistoryPanel({
  history,
  selected,
  onSelect,
}: {
  history: MatchResult[]
  selected: MatchResult | null
  onSelect: (m: MatchResult) => void
}) {
  return (
    <div className="p-3 border-t border-gray-700">
      <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Historico</h3>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {history.length === 0 && (
          <p className="text-gray-600 text-xs">Sem partidas anteriores</p>
        )}
        {history.map((m, i) => (
          <button
            key={m.id ?? i}
            onClick={() => onSelect(m)}
            className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
              selected?.id === m.id
                ? 'bg-blue-900 text-blue-200'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <span className="font-medium">{m.teamA}</span>
            <span className="text-gray-500 mx-1">vs</span>
            <span className="font-medium">{m.teamB}</span>
            <span
              className={`ml-2 text-xs ${
                m.winner === m.teamA ? 'text-blue-400' : 'text-red-400'
              }`}
            >
              {m.winner === m.teamA ? '[Azul]' : '[Verm]'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MatchHeader({
  match,
  onClear,
}: {
  match: MatchResult
  onClear: () => void
}) {
  const blueWon = match.winner === match.teamA
  const eventCount = match.timeline?.length ?? 0

  return (
    <div className="p-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-8">
        <div className={`text-center ${blueWon ? 'text-blue-300' : 'text-gray-400'}`}>
          <div className="font-bold text-sm">{match.teamA}</div>
          {blueWon && <div className="text-xs text-yellow-400 mt-0.5">VITORIA</div>}
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">VS</div>
          <div className="text-xs text-gray-500">{eventCount} eventos</div>
        </div>
        <div className={`text-center ${!blueWon ? 'text-red-300' : 'text-gray-400'}`}>
          <div className="font-bold text-sm">{match.teamB}</div>
          {!blueWon && <div className="text-xs text-yellow-400 mt-0.5">VITORIA</div>}
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-gray-500 hover:text-gray-300 text-sm px-3 py-1 rounded hover:bg-gray-800 transition-colors"
      >
        x Limpar
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MatchView() {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<MatchViewer | null>(null)
  const rafRef = useRef<number | null>(null)
  const mountedRef = useRef(false)

  // Store
  const currentMatchResult = useGameStore(s => s.currentMatchResult)
  const matchHistory = useGameStore(s => s.matchHistory)
  const isSimulating = useGameStore(s => s.isSimulating)
  const clearCurrentMatch = useGameStore(s => s.clearCurrentMatch)

  // Local playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [currentMinute, setCurrentMinute] = useState(0)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [eventLog, setEventLog] = useState<Array<{ minute: number; text: string }>>([])
  const [selectedHistoryMatch, setSelectedHistoryMatch] = useState<MatchResult | null>(null)

  // The match to visualise — current or selected from history
  const matchToView = selectedHistoryMatch ?? currentMatchResult

  // -------------------------------------------------------------------------
  // Mount PixiJS once
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return

    const viewer = new MatchViewer()
    viewerRef.current = viewer

    viewer.mount(canvasRef.current).then(() => {
      mountedRef.current = true
      // If a match was set before mount completed, load it now
      const store = useGameStore.getState()
      const pending = store.currentMatchResult
      if (pending) {
        viewer.loadMatch(pending, {
          onEventPlayed: (event: MatchEvent) => {
            const minute = Math.floor(event.time / 60)
            const text = formatEvent(event)
            if (text) {
              setEventLog(prev => [...prev.slice(-9), { minute, text }])
            }
          },
          onMatchEnd: () => {
            setPlaybackState('ended')
            setProgress(viewer.progress)
            setCurrentMinute(viewer.currentMinute)
          },
        })
      }
    }).catch((err: unknown) => {
      console.error('[MatchView] Failed to mount PixiJS:', err)
    })

    return () => {
      mountedRef.current = false
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      viewer.destroy()
      viewerRef.current = null
    }
  }, [])

  // -------------------------------------------------------------------------
  // Poll progress from viewer each animation frame while playing
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (playbackState !== 'playing') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const poll = () => {
      const viewer = viewerRef.current
      if (viewer) {
        setProgress(viewer.progress)
        setCurrentMinute(viewer.currentMinute)
      }
      rafRef.current = requestAnimationFrame(poll)
    }
    rafRef.current = requestAnimationFrame(poll)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [playbackState])

  // -------------------------------------------------------------------------
  // Load match into viewer when matchToView changes
  // -------------------------------------------------------------------------
  const onMatchEnd = useCallback(() => {
    setPlaybackState('ended')
    const viewer = viewerRef.current
    if (viewer) {
      setProgress(viewer.progress)
      setCurrentMinute(viewer.currentMinute)
    }
  }, [])

  const onEventPlayed = useCallback((event: MatchEvent) => {
    const minute = Math.floor(event.time / 60)
    const text = formatEvent(event)
    if (text) {
      setEventLog(prev => [...prev.slice(-9), { minute, text }])
    }
  }, [])

  useEffect(() => {
    if (!matchToView) return
    const viewer = viewerRef.current
    // If viewer not mounted yet, the mount effect will handle loading
    if (!viewer || !mountedRef.current) return

    // Reset local state
    setPlaybackState('idle')
    setCurrentMinute(0)
    setProgress(0)
    setEventLog([])

    viewer.loadMatch(matchToView, { onEventPlayed, onMatchEnd })
  }, [matchToView, onEventPlayed, onMatchEnd])

  // -------------------------------------------------------------------------
  // Control handlers
  // -------------------------------------------------------------------------
  const handlePlay = () => {
    viewerRef.current?.play()
    setPlaybackState('playing')
  }

  const handlePause = () => {
    viewerRef.current?.pause()
    setPlaybackState('paused')
    // Snapshot progress at pause
    const viewer = viewerRef.current
    if (viewer) {
      setProgress(viewer.progress)
      setCurrentMinute(viewer.currentMinute)
    }
  }

  const handleReset = () => {
    viewerRef.current?.reset()
    setPlaybackState('idle')
    setCurrentMinute(0)
    setProgress(0)
  }

  const handleSkipToEnd = () => {
    viewerRef.current?.skipToEnd()
    // onMatchEnd callback will fire synchronously and set 'ended'
  }

  const handleSpeedChange = (s: number) => {
    viewerRef.current?.setSpeed(s)
    setSpeed(s)
  }

  const handleSelectHistory = (m: MatchResult) => {
    setSelectedHistoryMatch(m)
  }

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  if (!matchToView && !isSimulating) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-gray-400 p-8">
        <span className="text-7xl select-none">&#9876;</span>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-200 mb-2">Nenhuma partida simulada</h2>
          <p className="text-sm">
            Avanca o calendario ate ao proximo Match Day para simular uma partida.
          </p>
        </div>
        {matchHistory.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-3">Ou reve uma partida anterior:</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {matchHistory.slice(-3).map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelectHistory(m)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                  {m.teamA} vs {m.teamB}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isSimulating && !matchToView) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm">A simular partida...</p>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Main layout (match loaded)
  // -------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
      {/* Header */}
      {matchToView && (
        <MatchHeader
          match={matchToView}
          onClear={() => {
            clearCurrentMatch()
            setSelectedHistoryMatch(null)
          }}
        />
      )}

      {/* Body: canvas + sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-gray-950 p-4 min-w-0">
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-2xl max-w-full max-h-full"
            style={{ width: '800px', height: '600px' }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-64 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden shrink-0">
          <EventLog events={eventLog} />
          <MatchHistoryPanel
            history={matchHistory}
            selected={selectedHistoryMatch}
            onSelect={handleSelectHistory}
          />
        </div>
      </div>

      {/* Playback controls */}
      {matchToView && (
        <PlaybackControls
          state={playbackState}
          speed={speed}
          progress={progress}
          currentMinute={currentMinute}
          onPlay={handlePlay}
          onPause={handlePause}
          onReset={handleReset}
          onSkipToEnd={handleSkipToEnd}
          onSpeedChange={handleSpeedChange}
        />
      )}
    </div>
  )
}
