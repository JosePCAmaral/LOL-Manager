import { useState, useMemo } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { RoleBadge } from '../components/RoleBadge'
import { AttributeBar } from '../components/AttributeBar'
import type { Player, Role } from '@types-app/index'
import type { ContractOffer } from '../../store/slices/squadSlice'
import { isContractExpiringSoon } from '@engine/finance/contracts'
import { generateContractOffer } from '@engine/finance/contracts'
import { getPlayerOverallRating } from '@engine/players/player.model'
import { seededRandom } from '@engine/core/rng'
import { SEED_PLAYERS } from '../../data/seed/players'

type TransferTab = 'squad' | 'freeAgents' | 'negotiations'

const ROLES_FILTER: { value: 'ALL' | Role; label: string }[] = [
  { value: 'ALL', label: 'ALL' },
  { value: 'TOP', label: 'TOP' },
  { value: 'JUNGLE', label: 'JGL' },
  { value: 'MID', label: 'MID' },
  { value: 'ADC', label: 'ADC' },
  { value: 'SUPPORT', label: 'SUP' },
]

interface ContractModalState {
  player: Player
  weeklySalary: number
  durationWeeks: number
  signingBonus: number
}

interface NegotiationRecord {
  id: string
  playerName: string
  role: Role
  weeklySalary: number
  durationWeeks: number
  timestamp: number
}

export function TransfersView() {
  const {
    players,
    budget,
    managedTeamId,
    signPlayer,
    releasePlayer,
    currentDay,
    currentYear,
  } = useGameStore(s => ({
    players: s.players,
    budget: s.budget,
    managedTeamId: s.managedTeamId,
    signPlayer: s.signPlayer,
    releasePlayer: s.releasePlayer,
    currentDay: s.currentDay,
    currentYear: s.currentYear,
  }))

  const [activeTab, setActiveTab] = useState<TransferTab>('squad')
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL')
  const [minOverall, setMinOverall] = useState(1)
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null)
  const [releaseModal, setReleaseModal] = useState<Player | null>(null)
  const [contractModal, setContractModal] = useState<ContractModalState | null>(null)
  const [negotiations, setNegotiations] = useState<NegotiationRecord[]>([])

  // Current week approximation for contract expiry check
  const currentWeek = Math.floor(currentDay / 7)

  // Free agents from seed — players without a contract or not on a team
  const freeAgents = useMemo(() => {
    const squadIds = new Set(players.map(p => p.id))
    const fromSeed = SEED_PLAYERS.filter(
      p => p.contract === null && !squadIds.has(p.id),
    )
    // If none, show players from other teams as "available for negotiation"
    if (fromSeed.length === 0) {
      return SEED_PLAYERS.filter(
        p => p.teamId !== managedTeamId && !squadIds.has(p.id),
      ).slice(0, 10)
    }
    return fromSeed
  }, [players, managedTeamId])

  const filteredFreeAgents = freeAgents.filter(p => {
    const roleOk = roleFilter === 'ALL' || p.role === roleFilter
    const overallOk = getPlayerOverallRating(p) >= minOverall
    return roleOk && overallOk
  })

  function openContractModal(player: Player) {
    const rng = seededRandom(`contract-${player.id}-${currentYear}-${currentDay}`)
    const dummyTeam = {
      id: managedTeamId ?? 'team-unknown',
      name: '',
      logoAssetId: '',
      leagueId: '',
      region: '',
      budget,
      reputation: 50,
      fanbase: 0,
      roster: { starters: {}, reserves: {} },
      staff: [],
      facilityLevel: 1,
    }
    const offer = generateContractOffer(player, dummyTeam, rng)
    setContractModal({
      player,
      weeklySalary: offer.weeklySalary,
      durationWeeks: offer.durationWeeks,
      signingBonus: offer.signingBonus,
    })
  }

  async function handleSign() {
    if (!contractModal) return
    const offer: ContractOffer = {
      salary: contractModal.weeklySalary,
      durationDays: contractModal.durationWeeks * 7,
      buyoutClause: contractModal.weeklySalary * 8,
    }
    await signPlayer(contractModal.player, offer)
    setNegotiations(n => [
      ...n,
      {
        id: `neg-${Date.now()}`,
        playerName: contractModal.player.name,
        role: contractModal.player.role,
        weeklySalary: contractModal.weeklySalary,
        durationWeeks: contractModal.durationWeeks,
        timestamp: Date.now(),
      },
    ])
    setContractModal(null)
  }

  async function handleRelease(player: Player) {
    await releasePlayer(player.id)
    setReleaseModal(null)
  }

  const totalCost = contractModal
    ? contractModal.weeklySalary * contractModal.durationWeeks + contractModal.signingBonus
    : 0
  const insufficientBudget = contractModal
    ? budget < contractModal.weeklySalary * 12
    : false

  const TABS: { key: TransferTab; label: string }[] = [
    { key: 'squad', label: 'Plantel Actual' },
    { key: 'freeAgents', label: 'Mercado Livre' },
    { key: 'negotiations', label: `Negociacoes (${negotiations.length})` },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <h1 className="text-xl font-bold text-gray-100">Transferencias</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gere contratos e pesquisa jogadores disponíveis</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        <div className={`flex-1 overflow-y-auto ${profilePlayer ? 'w-3/5' : 'w-full'}`}>
          {activeTab === 'squad' && (
            <SquadTab
              players={players}
              currentWeek={currentWeek}
              onRelease={setReleaseModal}
              onRenew={openContractModal}
            />
          )}
          {activeTab === 'freeAgents' && (
            <FreeAgentsTab
              players={filteredFreeAgents}
              roleFilter={roleFilter}
              minOverall={minOverall}
              onRoleFilter={setRoleFilter}
              onMinOverall={setMinOverall}
              onViewProfile={setProfilePlayer}
              onProposeContract={openContractModal}
            />
          )}
          {activeTab === 'negotiations' && (
            <NegotiationsTab negotiations={negotiations} />
          )}
        </div>

        {/* Side profile panel */}
        {profilePlayer && (
          <div className="w-2/5 border-l border-gray-800 overflow-y-auto p-5 bg-gray-900">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-gray-100 font-bold text-lg">{profilePlayer.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <RoleBadge role={profilePlayer.role} />
                  <span className="text-gray-400 text-sm">{profilePlayer.age} anos • {profilePlayer.region}</span>
                </div>
              </div>
              <button
                onClick={() => setProfilePlayer(null)}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none"
              >
                x
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">Overall:</span>
                <span className="text-yellow-400 font-semibold font-mono">
                  {getPlayerOverallRating(profilePlayer).toFixed(1)}
                </span>
                <span className="text-gray-400">Potencial:</span>
                <span className="text-gray-200">{profilePlayer.potential}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Atributos</h4>
              <AttributeBar label="Mecanica" value={profilePlayer.attributes.mechanics} />
              <AttributeBar label="Laning" value={profilePlayer.attributes.laning} />
              <AttributeBar label="Teamfight" value={profilePlayer.attributes.teamfight} />
              <AttributeBar label="Game Sense" value={profilePlayer.attributes.gameSense} />
              <AttributeBar label="Shotcalling" value={profilePlayer.attributes.shotcalling} />
              <AttributeBar label="Meta Adapt." value={profilePlayer.attributes.metaAdaptation} />
              <AttributeBar label="Consistencia" value={profilePlayer.attributes.consistency} />
              <AttributeBar label="Resiliencia" value={profilePlayer.attributes.resilience} />
            </div>

            <button
              onClick={() => { openContractModal(profilePlayer); setProfilePlayer(null) }}
              className="mt-5 w-full py-2 bg-green-800 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
            >
              Propor Contrato
            </button>
          </div>
        )}
      </div>

      {/* Release Confirmation Modal */}
      {releaseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100 mb-2">Confirmar Rescisao</h2>
            <p className="text-gray-300 text-sm mb-3">
              Tens a certeza que queres rescindir o contrato de{' '}
              <span className="font-semibold text-white">{releaseModal.name}</span>?
            </p>
            {releaseModal.contract && (
              <p className="text-gray-400 text-sm mb-4">
                Custo de rescisao:{' '}
                <span className="text-red-400 font-semibold">
                  € {releaseModal.contract.buyoutClause.toLocaleString()}
                </span>
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setReleaseModal(null)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleRelease(releaseModal)}
                className="flex-1 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
              >
                Confirmar Rescisao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Modal */}
      {contractModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100 mb-1">Proposta de Contrato</h2>
            <p className="text-gray-400 text-sm mb-4">
              {contractModal.player.name} ({contractModal.player.role} • {getPlayerOverallRating(contractModal.player).toFixed(1)})
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  Salario Semanal: € {contractModal.weeklySalary.toLocaleString()}
                </label>
                <input
                  type="range"
                  min={1000}
                  max={20000}
                  step={500}
                  value={contractModal.weeklySalary}
                  onChange={e =>
                    setContractModal(m =>
                      m ? { ...m, weeklySalary: Number(e.target.value), signingBonus: Number(e.target.value) >= 6000 ? Number(e.target.value) * 2 : 0 } : null,
                    )
                  }
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                  <span>€ 1.000</span>
                  <span>€ 20.000</span>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-2 block">Duracao</label>
                <div className="flex gap-2">
                  {[26, 52, 78].map(w => (
                    <button
                      key={w}
                      onClick={() => setContractModal(m => m ? { ...m, durationWeeks: w } : null)}
                      className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${
                        contractModal.durationWeeks === w
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {w} sem.
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bonus de assinatura:</span>
                  <span>€ {contractModal.signingBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clausula de rescisao:</span>
                  <span>€ {(contractModal.weeklySalary * 8).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-700 pt-1 mt-1 flex justify-between">
                  <span className="text-gray-400">Budget disponivel:</span>
                  <span className="text-green-400">€ {budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Custo total estimado:</span>
                  <span className={totalCost > budget ? 'text-red-400' : 'text-gray-100'}>
                    € {totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {insufficientBudget && (
                <p className="text-red-400 text-xs">
                  Budget insuficiente para cobrir 12 semanas de contrato.
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setContractModal(null)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSign()}
                disabled={insufficientBudget}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Propor Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SquadTabProps {
  players: Player[]
  currentWeek: number
  onRelease: (p: Player) => void
  onRenew: (p: Player) => void
}

function SquadTab({ players, currentWeek, onRelease, onRenew }: SquadTabProps) {
  if (players.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm p-6">
        Nenhum jogador no plantel.
      </div>
    )
  }

  return (
    <div className="p-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-800">
            <th className="text-left pb-2 pr-4">Jogador</th>
            <th className="text-left pb-2 pr-4">Role</th>
            <th className="text-right pb-2 pr-4">Overall</th>
            <th className="text-right pb-2 pr-4">Salario/sem</th>
            <th className="text-right pb-2 pr-4">Contrato</th>
            <th className="text-center pb-2 pr-4">Estado</th>
            <th className="text-right pb-2">Accao</th>
          </tr>
        </thead>
        <tbody>
          {players.map(player => {
            const expiring = isContractExpiringSoon(player, currentWeek)
            const hasContract = player.contract !== null
            const overall = getPlayerOverallRating(player)

            // Weeks remaining
            let weeksRemaining: number | null = null
            if (player.contract) {
              const endTotal = (player.contract.endDate.year - 1) * 365 + player.contract.endDate.dayOfYear
              const nowTotal = currentWeek * 7
              weeksRemaining = Math.max(0, Math.floor((endTotal - nowTotal) / 7))
            }

            return (
              <tr key={player.id} className="border-b border-gray-800/50">
                <td className="py-3 pr-4">
                  <span className="text-gray-100 font-medium">{player.name}</span>
                  {player.isStarter && (
                    <span className="ml-2 text-xs text-blue-400 font-medium">Titular</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <RoleBadge role={player.role} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <span className="text-yellow-400 font-mono font-semibold">{overall.toFixed(1)}</span>
                </td>
                <td className="py-3 pr-4 text-right text-gray-300">
                  {hasContract ? `€ ${player.contract!.salary.toLocaleString()}` : '—'}
                </td>
                <td className="py-3 pr-4 text-right text-gray-300">
                  {weeksRemaining !== null ? `${weeksRemaining} sem.` : '—'}
                </td>
                <td className="py-3 pr-4 text-center">
                  {!hasContract ? (
                    <span className="text-red-400">Sem contrato</span>
                  ) : expiring ? (
                    <span className="text-yellow-400">A expirar</span>
                  ) : (
                    <span className="text-green-400">OK</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {expiring && (
                      <button
                        onClick={() => onRenew(player)}
                        className="px-2 py-1 bg-blue-800 hover:bg-blue-700 text-blue-100 text-xs rounded transition-colors"
                      >
                        Renovar
                      </button>
                    )}
                    <button
                      onClick={() => onRelease(player)}
                      className="px-2 py-1 bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-200 text-xs rounded transition-colors"
                    >
                      Rescindir
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface FreeAgentsTabProps {
  players: Player[]
  roleFilter: 'ALL' | Role
  minOverall: number
  onRoleFilter: (r: 'ALL' | Role) => void
  onMinOverall: (v: number) => void
  onViewProfile: (p: Player) => void
  onProposeContract: (p: Player) => void
}

function FreeAgentsTab({
  players,
  roleFilter,
  minOverall,
  onRoleFilter,
  onMinOverall,
  onViewProfile,
  onProposeContract,
}: FreeAgentsTabProps) {
  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <div className="flex gap-1">
          {ROLES_FILTER.map(r => (
            <button
              key={r.value}
              onClick={() => onRoleFilter(r.value)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                roleFilter === r.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Overall min: {minOverall.toFixed(0)}</span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={minOverall}
            onChange={e => onMinOverall(Number(e.target.value))}
            className="w-28 accent-blue-500"
          />
        </div>
      </div>

      {players.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-10">
          Nenhum jogador corresponde aos filtros.
        </div>
      ) : (
        <div className="space-y-2">
          {players.map(player => {
            const overall = getPlayerOverallRating(player)
            // Estimate salary demand
            const salaryDemand = Math.round(overall * 500 * (overall <= 5 ? 1 : overall <= 10 ? 1.5 : overall <= 15 ? 2.5 : 4))

            return (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-800"
              >
                <RoleBadge role={player.role} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100 font-medium text-sm">{player.name}</span>
                    <span className="text-yellow-400 font-mono text-xs">{overall.toFixed(1)}</span>
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">
                    Idade: {player.age} | Regiao: {player.region} | Salario pedido: € {salaryDemand.toLocaleString()}/sem
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onViewProfile(player)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                  >
                    Ver Perfil
                  </button>
                  <button
                    onClick={() => onProposeContract(player)}
                    className="px-2 py-1 bg-green-800 hover:bg-green-700 text-green-100 text-xs rounded transition-colors"
                  >
                    Propor Contrato
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function NegotiationsTab({ negotiations }: { negotiations: NegotiationRecord[] }) {
  if (negotiations.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        Sem negociacoes em curso.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-2">
      {negotiations.map(neg => (
        <div
          key={neg.id}
          className="flex items-center gap-4 bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-800"
        >
          <RoleBadge role={neg.role} />
          <div className="flex-1 min-w-0">
            <span className="text-gray-100 font-medium text-sm">{neg.playerName}</span>
            <div className="text-gray-400 text-xs mt-0.5">
              € {neg.weeklySalary.toLocaleString()}/sem • {neg.durationWeeks} semanas
            </div>
          </div>
          <span className="text-green-400 text-xs font-semibold">Assinado</span>
        </div>
      ))}
    </div>
  )
}
