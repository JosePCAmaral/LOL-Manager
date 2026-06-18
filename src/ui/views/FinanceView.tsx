import { useGameStore } from '../../store/useGameStore'
import { RoleBadge } from '../components'

function fmt(n: number) {
  return n.toLocaleString('pt-PT')
}

export function FinanceView() {
  const budget = useGameStore(s => s.budget)
  const weeklyFinanceSummary = useGameStore(s => s.weeklyFinanceSummary)
  const sponsorshipDeals = useGameStore(s => s.sponsorshipDeals)
  const players = useGameStore(s => s.players)
  const processWeeklyFinances = useGameStore(s => s.processWeeklyFinances)
  const isLoading = useGameStore(s => s.isLoading)

  const summary = weeklyFinanceSummary

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Finanças</h1>
        <p className="text-gray-400 mt-1">Receitas, despesas e patrocínios</p>
      </div>

      {/* Secção 1 — Resumo financeiro */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Budget Total</p>
            <p className={`text-3xl font-bold font-mono ${budget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              € {fmt(budget)}
            </p>
          </div>
          <button
            onClick={() => void processWeeklyFinances()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded text-sm transition-colors"
          >
            Processar Semana
          </button>
        </div>

        {summary ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                <th className="text-left pb-2">Categoria</th>
                <th className="text-right pb-2 text-green-500">Receita</th>
                <th className="text-right pb-2 text-red-500">Despesa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              <tr className="even:bg-gray-800/30">
                <td className="py-2 text-gray-300">Salários Jogadores</td>
                <td className="py-2 text-right text-gray-500">—</td>
                <td className="py-2 text-right text-red-400 font-mono">€ {fmt(summary.breakdown.playerSalaries)}</td>
              </tr>
              <tr className="even:bg-gray-800/30">
                <td className="py-2 text-gray-300">Salários Staff</td>
                <td className="py-2 text-right text-gray-500">—</td>
                <td className="py-2 text-right text-red-400 font-mono">€ {fmt(summary.breakdown.staffSalaries)}</td>
              </tr>
              <tr className="even:bg-gray-800/30">
                <td className="py-2 text-gray-300">Instalações</td>
                <td className="py-2 text-right text-gray-500">—</td>
                <td className="py-2 text-right text-red-400 font-mono">€ {fmt(summary.breakdown.facilities)}</td>
              </tr>
              <tr className="even:bg-gray-800/30">
                <td className="py-2 text-gray-300">Patrocínios</td>
                <td className="py-2 text-right text-green-400 font-mono">€ {fmt(summary.breakdown.sponsorships)}</td>
                <td className="py-2 text-right text-gray-500">—</td>
              </tr>
              {summary.breakdown.prizeMoney > 0 && (
                <tr className="even:bg-gray-800/30">
                  <td className="py-2 text-gray-300">Prémios</td>
                  <td className="py-2 text-right text-green-400 font-mono">€ {fmt(summary.breakdown.prizeMoney)}</td>
                  <td className="py-2 text-right text-gray-500">—</td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-700 font-semibold">
                <td className="py-2 text-gray-100">Total</td>
                <td className="py-2 text-right text-green-400 font-mono">€ {fmt(summary.revenue)}</td>
                <td className="py-2 text-right text-red-400 font-mono">€ {fmt(summary.expenses)}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-300 font-semibold">Saldo</td>
                <td />
                <td className={`py-2 text-right font-mono font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.balance >= 0 ? '+' : ''}€ {fmt(summary.balance)}
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">Clica em "Processar Semana" para calcular o resumo financeiro.</p>
        )}
      </div>

      {/* Secção 2 — Patrocínios activos */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Patrocínios Activos</h2>
        {sponsorshipDeals.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Sem patrocínios activos. Avança na classificação para receber ofertas.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                <th className="text-left pb-2">Patrocinador</th>
                <th className="text-right pb-2">Valor Semanal</th>
                <th className="text-right pb-2">Semanas Restantes</th>
                <th className="text-right pb-2">Bónus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {sponsorshipDeals.map(deal => (
                <tr key={deal.id} className="even:bg-gray-800/30">
                  <td className="py-2 text-gray-200">{deal.sponsorName ?? deal.id}</td>
                  <td className="py-2 text-right text-green-400 font-mono">€ {fmt(deal.weeklyValue)}</td>
                  <td className="py-2 text-right text-gray-300">{deal.duration}</td>
                  <td className="py-2 text-right text-yellow-400 text-xs">{deal.bonusCondition ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Secção 3 — Contratos do plantel */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Contratos do Plantel</h2>
        {players.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum jogador no plantel.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-800">
                <th className="text-left pb-2">Jogador</th>
                <th className="text-left pb-2">Role</th>
                <th className="text-right pb-2">Salário Semanal</th>
                <th className="text-right pb-2">Contrato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {players.map((p, i) => {
                const daysLeft = p.contract
                  ? (p.contract.endDate.year - 1) * 365 + p.contract.endDate.dayOfYear
                  : 0
                const weeksLeft = p.contract ? Math.max(0, Math.floor(daysLeft / 7)) : 0
                return (
                  <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-gray-800/30'}>
                    <td className="py-2 text-gray-200">{p.name}</td>
                    <td className="py-2">
                      <RoleBadge role={p.role} />
                    </td>
                    <td className="py-2 text-right text-gray-300 font-mono">
                      {p.contract ? `€ ${fmt(p.contract.salary)}` : '—'}
                    </td>
                    <td className="py-2 text-right text-gray-400 text-xs">
                      {p.contract ? `${weeksLeft} semanas` : 'Sem contrato'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
