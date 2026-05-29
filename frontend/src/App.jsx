import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar      from './components/Sidebar'
import Dashboard    from './pages/Dashboard'
import Transactions from './pages/Transactions'
import FixedBills   from './pages/FixedBills'
import Goals        from './pages/Goals'
import Debts        from './pages/Debts'
import Login        from './pages/Login'

const pages = { dashboard: Dashboard, transactions: Transactions, fixedbills: FixedBills, goals: Goals, debts: Debts }

function AppInner() {
  const { session } = useAuth()
  const [page, setPage] = useState('dashboard')

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Login />

  const Page = pages[page] || Dashboard
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Page />
      </main>
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
