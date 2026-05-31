import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import BottomNav            from './components/Sidebar'
import DesktopSidebar       from './components/DesktopSidebar'
import FAB                  from './components/FAB'
import NewTransactionSheet  from './components/NewTransactionSheet'
import Dashboard            from './pages/Dashboard'
import Transactions         from './pages/Transactions'
import FixedBills           from './pages/FixedBills'
import Goals                from './pages/Goals'
import Debts                from './pages/Debts'
import AiPage               from './pages/AiPage'
import Login                from './pages/Login'

const pages = { dashboard: Dashboard, transactions: Transactions, fixedbills: FixedBills, goals: Goals, debts: Debts, ai: AiPage }

function AppInner() {
  const { session } = useAuth()
  const [page,       setPage]       = useState('dashboard')
  const [txSheet,    setTxSheet]    = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  if (session === undefined) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--primary)' }}
        />
      </div>
    )
  }

  if (!session) return <Login />

  const Page = pages[page] || Dashboard

  return (
    <>
      {/* ── Mobile ── */}
      <div className="sm:hidden relative w-full h-[100dvh] overflow-hidden" style={{ background: 'var(--bg)' }}>
        <main
          className="absolute inset-0 overflow-y-auto no-scrollbar"
          style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}
        >
          <Page key={page} refreshKey={refreshKey} />
        </main>
        <BottomNav currentPage={page} onNavigate={setPage} />
        <FAB onClick={() => setTxSheet(true)} />
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:flex h-[100dvh]" style={{ background: 'var(--bg)' }}>
        <DesktopSidebar currentPage={page} onNavigate={setPage} />
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-[1200px] mx-auto">
            <Page key={page} refreshKey={refreshKey} />
          </div>
        </main>

        {/* Desktop FAB */}
        <button
          onClick={() => setTxSheet(true)}
          className="fixed right-6 bottom-6 w-14 h-14 rounded-full grid place-items-center text-white z-40 btn-press ripple-wrapper"
          style={{
            background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
            boxShadow: '0 8px 32px var(--grad-glow)',
          }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {txSheet && (
        <NewTransactionSheet
          onClose={() => setTxSheet(false)}
          onSave={() => setRefreshKey(k => k + 1)}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
