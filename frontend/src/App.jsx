import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import BottomNav            from './components/Sidebar'
import FAB                  from './components/FAB'
import NewTransactionSheet  from './components/NewTransactionSheet'
import Dashboard            from './pages/Dashboard'
import Transactions         from './pages/Transactions'
import FixedBills           from './pages/FixedBills'
import Goals                from './pages/Goals'
import Debts                from './pages/Debts'
import Login                from './pages/Login'

const pages = { dashboard: Dashboard, transactions: Transactions, fixedbills: FixedBills, goals: Goals, debts: Debts }

function AppInner() {
  const { session } = useAuth()
  const [page,       setPage]       = useState('dashboard')
  const [txSheet,    setTxSheet]    = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  if (session === undefined) {
    return (
      <div className="min-h-[100dvh] bg-[#050507] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Login />

  const Page = pages[page] || Dashboard

  return (
    <div className="flex justify-center min-h-[100dvh] bg-[#050507]">
      <div className="relative w-full max-w-app h-[100dvh] max-h-[932px] bg-[#0a0a0d] overflow-hidden sm:rounded-[44px]">
        <main className="absolute inset-0 overflow-y-auto no-scrollbar pb-32">
          <Page refreshKey={refreshKey} />
        </main>

        <BottomNav currentPage={page} onNavigate={setPage} />
        <FAB onClick={() => setTxSheet(true)} />

        {txSheet && (
          <NewTransactionSheet
            onClose={() => setTxSheet(false)}
            onSave={() => setRefreshKey(k => k + 1)}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
