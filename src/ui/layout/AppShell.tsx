import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useGameStore } from '../../store/useGameStore'
import type { View } from '../../store/useGameStore'
import { DashboardView } from '../views/DashboardView'
import { SquadView } from '../views/SquadView'
import { CalendarView } from '../views/CalendarView'
import { DraftView } from '../views/DraftView'
import { MatchView } from '../views/MatchView'
import { FinanceView } from '../views/FinanceView'
import { ScoutingView } from '../views/ScoutingView'
import { TransfersView } from '../views/TransfersView'
import { StandingsView } from '../views/StandingsView'
import { HomeView } from '../views/HomeView'
import { SavesView } from '../views/SavesView'
import { NewGameView } from '../views/NewGameView'

export type { View }

const FULL_SCREEN_VIEWS: View[] = ['home', 'saves', 'newgame']

function ViewContent({ view }: { view: View }) {
  switch (view) {
    case 'home':      return <HomeView />
    case 'saves':     return <SavesView />
    case 'newgame':   return <NewGameView />
    case 'dashboard': return <DashboardView />
    case 'squad':     return <SquadView />
    case 'calendar':  return <CalendarView />
    case 'draft':     return <DraftView />
    case 'match':     return <MatchView />
    case 'finance':   return <FinanceView />
    case 'scouting':  return <ScoutingView />
    case 'transfers': return <TransfersView />
    case 'standings': return <StandingsView />
    default:          return <DashboardView />
  }
}

export function AppShell() {
  const currentView = useGameStore(s => s.currentView)
  const navigateTo = useGameStore(s => s.navigateTo)
  const saveGame = useGameStore(s => s.saveGame)

  const isFullScreen = FULL_SCREEN_VIEWS.includes(currentView)

  const handleSave = () => {
    void saveGame('save-1', 'Auto-save')
  }

  if (isFullScreen) {
    return <ViewContent view={currentView} />
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={navigateTo} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onSave={handleSave} />
        <main className="flex-1 overflow-auto">
          <ViewContent view={currentView} />
        </main>
      </div>
    </div>
  )
}
