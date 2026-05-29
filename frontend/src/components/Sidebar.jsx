import { LayoutDashboard, ArrowLeftRight, Target, CreditCard, CalendarCheck } from 'lucide-react'

const nav = [
  { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos',  Icon: ArrowLeftRight  },
  { id: 'fixedbills',   label: 'Contas',       Icon: CalendarCheck   },
  { id: 'goals',        label: 'Metas',        Icon: Target          },
  { id: 'debts',        label: 'Dívidas',      Icon: CreditCard      },
]

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <>
      {/* ── Desktop: lateral ── */}
      <aside className="hidden md:flex w-60 bg-gray-900 flex-col shrink-0">
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-black text-base">$</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Finanças</p>
              <p className="text-gray-500 text-xs">Pessoais</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPage === id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-gray-800">
          <p className="text-gray-600 text-xs text-center">v1.0.0 · offline</p>
        </div>
      </aside>

      {/* ── Mobile: bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800">
        <div className="flex">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                currentPage === id ? 'text-indigo-400' : 'text-gray-500 active:text-gray-300'
              }`}
            >
              <Icon size={20} strokeWidth={currentPage === id ? 2.5 : 1.8} />
              <span className="leading-none">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
