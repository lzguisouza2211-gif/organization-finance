import { useState } from 'react'
import Sidebar      from './components/Sidebar'
import Dashboard    from './pages/Dashboard'
import Transactions from './pages/Transactions'
import FixedBills   from './pages/FixedBills'
import Goals        from './pages/Goals'
import Debts        from './pages/Debts'

const pages = { dashboard: Dashboard, transactions: Transactions, fixedbills: FixedBills, goals: Goals, debts: Debts }

export default function App() {
  const [page, setPage] = useState('dashboard')
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
