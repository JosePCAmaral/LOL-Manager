import { useState } from 'react'
import { useGameStore } from '../../store/useGameStore'
import { RoleBadge } from '../components/RoleBadge'
import type { ScoutingProspect } from '@types-app/index'
import type { ContractOffer } from '../../store/slices/squadSlice'
import { generateContractOffer } from '@engine/finance/contracts'
import { seededRandom } from '@engine/core/rng'
import type { Player } from '@types-app/index'

const REGIONS = ['EMEA', 'North America', 'Korea', 'China', 'Pacific', 'Latin America']
const COUNTS = [3, 5, 10]

type ProspectTab = 'tracking' | 'scouted' | 'dismissed'

interface ContractModalState {
  prospect: ScoutingProspect
  weeklySalary: number
  durationWeeks: number
  signingBonus: number
}

function prospectToMinimalPlayer(prospect: ScoutingProspect): Player {
  const rating = prospect.estimatedRating ?? 10
  const attrValue = Math.max(1, Math.min(20, Math.round(rating)))
  return {
    id: prospect.id,
    name: prospect.name,
    role: prospect.role ?? prospect.estimatedRole,
    age: prospect.age ?? 18,
    region: prospect.region,
    attributes: {
      mechanics: attrValue,
      laning: attrValue,
      teamfight: attrValue,
      gameSense: attrValue,
      shotcalling: attrValue,
      metaAdaptation: attrValue,
      consistency: attrValue,
      resilience: attrValue,
      synergy: 0,
    },
    championPool: [],
    potential: prospect.potential ?? 70,
    morale: 80,
    stamina: 90,
    burnoutRisk: 10,
    contract: null,
    teamId: null,
    isStarter: false,
  }
}

export function ScoutingView() {
  const {
    prospects,
    scoutReports,
    dismissedProspectIds,
    discoverProspects,
    scoutProspect,
    dismissProspect,
    signPlayer,
    budget,
    managedTeamId,
    currentDay,
    currentYear,
  } = useGameStore(s => ({
    prospects: s.prospects,
    scoutReports: s.scoutReports,
    dismissedProspectIds: s.dismissedProspectIds,
    discoverProspects: s.discoverProspects,
    scoutProspect: s.scoutProspect,
    dismissProspect: s.dismissProspect,
    signPlayer: s.signPlayer,
    budget: s.budget,
    managedTeamId: s.managedTeamId,
    currentDay: s.currentDay,
    currentYear: s.currentYear,
  }))

  const [region, setRegion] = useState('EMEA')
  const [count, setCount] = useState(5)
  const [activeTab, setActiveTab] = useState<ProspectTab>('tracking')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contractModal, setContractModal] = useState<ContractModalState | null>(null)
  const [scoutingId, setScoutingId] = useState<string | null>(null)

  const dismissedSet = new Set(dismissedProspectIds)

  const trackingProspects = prospects.filter(
    p => !dismissedSet.has(p.id) && !p.discovered,
  )
  const scoutedProspects = prospects.filter(
    p => !dismissedSet.has(p.id) && p.discovered,
  )
  const dismissedProspects = prospects.filter(p => dismissedSet.has(p.id))

  const tabProspects: Record<ProspectTab, ScoutingProspect[]> = {
    tracking: trackingProspects,
    scouted: scoutedProspects,
    dismissed: dismissedProspects,
  }

  const currentList = tabProspects[activeTab]
  const selected = prospects.find(p => p.id === selectedId) ?? null
  const selectedReport = selectedId ? (scoutReports[selectedId] ?? null) : null

  function openContractModal(prospect: ScoutingProspect) {
    const player = prospectToMinimalPlayer(prospect)
    const rng = seededRandom(`contract-${prospect.id}-${currentYear}-${currentDay}`)
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
      prospect,
      weeklySalary: offer.weeklySalary,
      durationWeeks: offer.durationWeeks,
      signingBonus: offer.signingBonus,
    })
  }

  async function handleSign() {
    if (!contractModal) return
    const player = prospectToMinimalPlayer(contractModal.prospect)
    const offer: ContractOffer = {
      salary: contractModal.weeklySalary,
      durationDays: contractModal.durationWeeks * 7,
      buyoutClause: contractModal.weeklySalary * 8,
    }
    await signPlayer(player, offer)
    dismissProspect(contractModal.prospect.id)
    setContractModal(null)
  }

  async function handleScout(prospectId: string) {
    setScoutingId(prospectId)
    await scoutProspect(prospectId)
    setScoutingId(null)
  }

  const totalCost = contractModal
    ? contractModal.weeklySalary * contractModal.durationWeeks + contractModal.signingBonus
    : 0
  const insufficientBudget = contractModal
    ? budget < contractModal.weeklySalary * 12
    : false

  const TABS: { key: ProspectTab; label: string }[] = [
    { key: 'tracking', label: `A Acompanhar (${trackingProspects.length})` },
    { key: 'scouted', label: `Scouted (${scoutedProspects.length})` },
    { key: 'dismissed', label: `Dispensados (${dismissedProspects.length})` },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
        <h1 className="text-xl font-bold text-gray-100">Scouting</h1>
        <p className="text-gray-400 text-sm mt-0.5">Descobre talentos de Solo Queue</p>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <label className="text-gray-400 text-sm">Região:</label>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
          >
            {REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <label className="text-gray-400 text-sm">Quantidade:</label>
          <select
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200"
          >
            {COUNTS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => discoverProspects(region, count)}
            className="bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 rounded transition-colors"
          >
            Descobrir Prospects
          </button>

          <span className="text-gray-400 text-sm ml-2">
            Prospects acompanhados: {trackingProspects.length + scoutedProspects.length}
          </span>
        </div>
      </div>

      {/* Body — two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column — prospect list */}
        <div className="w-3/5 border-r border-gray-800 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {currentList.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                {activeTab === 'tracking'
                  ? 'Nenhum prospect a acompanhar. Clica em "Descobrir Prospects".'
                  : activeTab === 'scouted'
                  ? 'Nenhum prospect foi scouted ainda.'
                  : 'Nenhum prospect dispensado.'}
              </div>
            ) : (
              currentList.map(prospect => {
                const report = scoutReports[prospect.id]
                const isSelected = selectedId === prospect.id
                const role = prospect.role ?? prospect.estimatedRole
                const isScouting = scoutingId === prospect.id

                return (
                  <div
                    key={prospect.id}
                    onClick={() => setSelectedId(prospect.id)}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-800' : 'hover:bg-gray-850'
                    }`}
                  >
                    <RoleBadge role={role} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-100 text-sm font-medium truncate">
                          {prospect.name}
                        </span>
                        <span className="text-yellow-400 text-xs font-mono">
                          {prospect.discovered ? '' : '~'}
                          {prospect.estimatedRating?.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray-400 text-xs">
                          {role} • {prospect.age ?? '?'} anos • {prospect.region}
                        </span>
                        {prospect.discovered || report ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-800 text-green-200">
                            Scouted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-yellow-800 text-yellow-200">
                            Nao scouted
                          </span>
                        )}
                      </div>
                    </div>

                    {activeTab !== 'dismissed' && (
                      <div className="flex gap-1 shrink-0">
                        {!prospect.discovered && (
                          <button
                            onClick={e => { e.stopPropagation(); void handleScout(prospect.id) }}
                            disabled={isScouting}
                            className="px-2 py-1 bg-blue-800 hover:bg-blue-700 text-blue-100 text-xs rounded transition-colors disabled:opacity-50"
                          >
                            {isScouting ? '...' : 'Scout'}
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); dismissProspect(prospect.id) }}
                          className="px-2 py-1 bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-200 text-xs rounded transition-colors"
                        >
                          Dispensar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right column — detail */}
        <div className="w-2/5 overflow-y-auto p-5">
          {!selected ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              Selecciona um prospect para ver o relatorio
            </div>
          ) : (
            <ProspectDetail
              prospect={selected}
              report={scoutReports[selected.id] ?? null}
              onScout={() => void handleScout(selected.id)}
              scouting={scoutingId === selected.id}
              onProposeContract={() => openContractModal(selected)}
            />
          )}
        </div>
      </div>

      {/* Contract Modal */}
      {contractModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-100 mb-1">Proposta de Contrato</h2>
            <p className="text-gray-400 text-sm mb-4">
              {contractModal.prospect.name} ({(contractModal.prospect.role ?? contractModal.prospect.estimatedRole)} • ~{contractModal.prospect.estimatedRating?.toFixed(1)})
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Salario Semanal: € {contractModal.weeklySalary.toLocaleString()}</label>
                <input
                  type="range"
                  min={1000}
                  max={20000}
                  step={500}
                  value={contractModal.weeklySalary}
                  onChange={e => setContractModal(m => m ? { ...m, weeklySalary: Number(e.target.value), signingBonus: Number(e.target.value) >= 6000 ? Number(e.target.value) * 2 : 0 } : null)}
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
// Sub-component: ProspectDetail
// ---------------------------------------------------------------------------

interface ProspectDetailProps {
  prospect: ScoutingProspect
  report: import('@engine/scouting/scoutReport').ScoutReport | null
  onScout: () => void
  scouting: boolean
  onProposeContract: () => void
}

function ProspectDetail({ prospect, report, onScout, scouting, onProposeContract }: ProspectDetailProps) {
  const role = prospect.role ?? prospect.estimatedRole

  const recBadge = {
    sign: { cls: 'bg-green-700 text-white', label: 'CONTRATAR' },
    monitor: { cls: 'bg-yellow-700 text-black', label: 'MONITORAR' },
    pass: { cls: 'bg-red-900 text-white', label: 'DISPENSAR' },
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-100">{prospect.name}</h2>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
          <span>Role: <span className="text-gray-200 font-medium">{role}</span></span>
          <span>|</span>
          <span>Idade: <span className="text-gray-200">{prospect.age ?? '?'}</span></span>
          <span>|</span>
          <span>Regiao: <span className="text-gray-200">{prospect.region}</span></span>
        </div>
      </div>

      {!report ? (
        <div className="space-y-3">
          <div className="bg-gray-800 rounded p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Rating estimado:</span>
              <span className="text-yellow-400 font-mono font-semibold">
                ~{prospect.estimatedRating?.toFixed(1) ?? '?'}
              </span>
              <span className="text-yellow-500 text-xs">(impreciso antes do scouting)</span>
            </div>
            <div className="text-sm text-gray-400">
              Potencial: <span className="text-gray-500 italic">desconhecido</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm">
            Clica em "Scout" para obter relatorio detalhado.
          </p>

          <button
            onClick={onScout}
            disabled={scouting}
            className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50"
          >
            {scouting ? 'A fazer scouting...' : 'Scout'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-gray-800 rounded p-3 space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-400">Rating estimado: </span>
                <span className="text-gray-100 font-semibold font-mono">{report.estimatedRating.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-gray-400">Potencial est.: </span>
                <span className="text-gray-100 font-semibold">{report.estimatedPotential}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="text-gray-400">Fit no plantel:</span>
                <span className="text-gray-200 font-mono">{Math.round(report.roleFit * 100)}%</span>
              </div>
              <div className="bg-gray-700 rounded-full h-2 w-full">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${report.roleFit * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <span className="text-gray-400 text-xs uppercase tracking-wide">Recomendacao</span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded font-bold text-sm ${
                  recBadge[report.recommendation].cls
                }`}
              >
                {recBadge[report.recommendation].label}
              </span>
            </div>
          </div>

          <div>
            <span className="text-gray-400 text-xs uppercase tracking-wide">Notas do scout</span>
            <ul className="mt-1 space-y-1">
              {report.notes.map((note, i) => (
                <li key={i} className="text-gray-300 text-sm flex gap-2">
                  <span className="text-gray-500">•</span>
                  <span>"{note}"</span>
                </li>
              ))}
            </ul>
          </div>

          {(report.recommendation === 'sign' || report.recommendation === 'monitor') && (
            <button
              onClick={onProposeContract}
              className="w-full py-2 bg-green-800 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
            >
              Propor Contrato
            </button>
          )}
        </div>
      )}
    </div>
  )
}
