import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { getPlayerOverallRating } from '@engine/players/player.model'
import { RoleBadge, AttributeBar, StatBar } from '../components'
import type { Player } from '@types-app/index'

type SquadTab = 'starters' | 'reserves' | 'staff'

const ATTR_LABELS: Record<string, string> = {
  mechanics: 'Mecânica',
  laning: 'Laning',
  teamfight: 'Teamfight',
  gameSense: 'Game Sense',
  shotcalling: 'Shotcalling',
  metaAdaptation: 'Adaptação Meta',
  consistency: 'Consistência',
  resilience: 'Resiliência',
}

function PlayerListItem({
  player,
  selected,
  onClick,
}: {
  player: Player
  selected: boolean
  onClick: () => void
}) {
  const overall = getPlayerOverallRating(player)
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded border text-left transition-colors ${
        selected
          ? 'bg-blue-900/40 border-blue-600'
          : 'bg-gray-900 border-gray-800 hover:bg-gray-800/50 hover:border-gray-700'
      }`}
    >
      <RoleBadge role={player.role} />
      <div className="flex-1 min-w-0">
        <div className="text-gray-100 font-medium text-sm truncate">{player.name}</div>
        <div className="flex gap-4 mt-1">
          <StatBar label="Stamina" value={player.stamina} />
          <StatBar label="Morale" value={player.morale} />
        </div>
      </div>
      <span className="text-yellow-400 text-sm font-mono shrink-0">★ {overall.toFixed(1)}</span>
    </button>
  )
}

function PlayerDetail({ player }: { player: Player }) {
  const trainPlayer = useGameStore(s => s.trainPlayer)
  const allChampions = useGameStore(s => s.allChampions)
  const [selectedChampionId, setSelectedChampionId] = useState<string>(
    player.championPool[0]?.championId ?? '',
  )

  const overall = getPlayerOverallRating(player)
  const canTrain = player.stamina >= 10

  const sortedPool = [...player.championPool]
    .sort((a, b) => b.masteryLevel - a.masteryLevel)
    .slice(0, 5)

  const contractDaysLeft = player.contract
    ? (player.contract.endDate.year - 1) * 365 + player.contract.endDate.dayOfYear
    : 0
  const weeksLeft = player.contract ? Math.floor(contractDaysLeft / 7) : 0

  const getChampionName = (id: string) => {
    const found = allChampions?.find(c => c.id === id)
    return found?.name ?? id
  }

  return (
    <div className="space-y-5">
      {/* Info básica */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-gray-100 font-bold text-xl">{player.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={player.role} />
              <span className="text-gray-400 text-sm">{player.region} · Idade {player.age}</span>
            </div>
          </div>
          <span className="text-yellow-400 text-2xl font-bold font-mono">★ {overall.toFixed(1)}</span>
        </div>
        <div className="mt-3 space-y-1">
          <StatBar label="Stamina" value={player.stamina} />
          <StatBar label="Morale" value={player.morale} />
        </div>
      </div>

      {/* Atributos */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Atributos</h4>
        <div className="space-y-1">
          {Object.entries(player.attributes).map(([key, val]) => (
            <AttributeBar
              key={key}
              label={ATTR_LABELS[key] ?? key}
              value={val}
              max={20}
            />
          ))}
        </div>
      </div>

      {/* Pool de Maestria */}
      {sortedPool.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pool de Maestria</h4>
          <div className="space-y-1">
            {sortedPool.map(m => (
              <AttributeBar
                key={m.championId}
                label={getChampionName(m.championId)}
                value={m.masteryLevel}
                max={20}
              />
            ))}
          </div>
        </div>
      )}

      {/* Acções de Treino */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Acções de Treino</h4>
        {!canTrain && (
          <p className="text-red-400 text-xs mb-2">Stamina insuficiente para treinar (mínimo 10).</p>
        )}
        <div className="space-y-2">
          <button
            onClick={() => void trainPlayer(player.id, 'general')}
            disabled={!canTrain}
            className="w-full px-3 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
          >
            💪 Treino Geral
          </button>

          {sortedPool.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedChampionId}
                onChange={e => setSelectedChampionId(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-2"
              >
                {sortedPool.map(m => (
                  <option key={m.championId} value={m.championId}>
                    {getChampionName(m.championId)} ({m.masteryLevel}/20)
                  </option>
                ))}
              </select>
              <button
                onClick={() => void trainPlayer(player.id, 'champion_focus', selectedChampionId)}
                disabled={!canTrain || !selectedChampionId}
                className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                🎯
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contrato */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contrato</h4>
        {player.contract ? (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Salário semanal</span>
              <span className="text-gray-200 font-mono">€ {player.contract.salary.toLocaleString('pt-PT')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Buyout</span>
              <span className="text-gray-200 font-mono">€ {player.contract.buyoutClause.toLocaleString('pt-PT')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duração restante</span>
              <span className="text-gray-200">~{weeksLeft} semanas</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Sem contrato activo.</p>
        )}
      </div>
    </div>
  )
}

export function SquadView() {
  const players = useGameStore(s => s.players)
  const staff = useGameStore(s => s.staff)
  const selectedPlayerId = useGameStore(s => s.selectedPlayerId)
  const selectPlayer = useGameStore(s => s.selectPlayer)

  const [activeTab, setActiveTab] = useState<SquadTab>('starters')

  const starters = players.filter(p => p.isStarter)
  const reserves = players.filter(p => !p.isStarter)
  const selected = players.find(p => p.id === selectedPlayerId)

  const tabPlayers = activeTab === 'starters' ? starters : reserves

  const tabs: { key: SquadTab; label: string; count: number }[] = [
    { key: 'starters', label: 'Titulares', count: starters.length },
    { key: 'reserves', label: 'Reservas', count: reserves.length },
    { key: 'staff', label: 'Staff', count: staff.length },
  ]

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Plantel</h1>
        <p className="text-gray-400 mt-1">Gestão de elenco e staff</p>
      </div>

      <div className="flex gap-6 h-[calc(100%-80px)]">
        {/* Coluna esquerda */}
        <div className="w-80 flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-gray-800 mb-3">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  if (tab.key === 'staff') selectPlayer(null)
                }}
                className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activeTab === 'staff' ? (
              staff.length === 0 ? (
                <p className="text-gray-500 text-sm">Sem staff contratado.</p>
              ) : (
                staff.map(s => (
                  <div
                    key={s.id}
                    className="bg-gray-900 border border-gray-800 rounded px-4 py-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-gray-200 font-medium text-sm">{s.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{s.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">Competência</div>
                        <div className="text-blue-400 font-mono text-sm">{s.competence}/20</div>
                      </div>
                    </div>
                    <div className="mt-2 text-gray-500 text-xs">
                      Salário: € {s.salary.toLocaleString('pt-PT')}/semana
                    </div>
                  </div>
                ))
              )
            ) : tabPlayers.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum jogador nesta categoria.</p>
            ) : (
              tabPlayers.map(p => (
                <PlayerListItem
                  key={p.id}
                  player={p}
                  selected={p.id === selectedPlayerId}
                  onClick={() => selectPlayer(p.id === selectedPlayerId ? null : p.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Coluna direita — Detalhe */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-5 overflow-y-auto">
          {selected ? (
            <PlayerDetail player={selected} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Selecciona um jogador para ver os detalhes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
