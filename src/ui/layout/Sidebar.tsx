import type { View } from './AppShell'

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
}

const NAV_ITEMS: { view: Extract<View, 'dashboard' | 'squad' | 'calendar' | 'draft' | 'match' | 'finance' | 'scouting' | 'transfers' | 'standings'>; label: string; icon: string }[] = [
  { view: 'dashboard',  label: 'Dashboard',    icon: '🏠' },
  { view: 'squad',      label: 'Squad',        icon: '👥' },
  { view: 'standings',  label: 'Classificacao', icon: '🏆' },
  { view: 'calendar',   label: 'Calendário',   icon: '📅' },
  { view: 'draft',      label: 'Draft',        icon: '⚔️' },
  { view: 'match',      label: 'Partida',      icon: '▶️' },
  { view: 'finance',    label: 'Financas',     icon: '💰' },
  { view: 'scouting',   label: 'Scouting',     icon: '🔍' },
  { view: 'transfers',  label: 'Transfers',    icon: '🔄' },
]

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-4 gap-1">
      <div className="px-4 pb-4 border-b border-gray-800">
        <span className="text-blue-400 font-bold text-lg tracking-wide">LoL Manager</span>
      </div>
      <nav className="flex flex-col gap-1 mt-2 px-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm text-left transition-colors ${
              currentView === item.view
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
