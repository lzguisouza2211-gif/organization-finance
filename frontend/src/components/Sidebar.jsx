import { LayoutDashboard, ArrowLeftRight, Target, CreditCard, CalendarCheck } from 'lucide-react'

const nav = [
  { id: 'dashboard',    label: 'Início',      Icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos', Icon: ArrowLeftRight  },
  { id: 'fixedbills',   label: 'Contas',      Icon: CalendarCheck   },
  { id: 'goals',        label: 'Metas',       Icon: Target          },
  { id: 'debts',        label: 'Dívidas',     Icon: CreditCard      },
]

export default function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40">
      <div className="mx-3 mb-3 rounded-[26px] bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-2xl px-1.5 py-1.5 flex">
        {nav.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="flex-1 flex flex-col items-center gap-1 py-1 min-h-[44px] justify-center"
          >
            {currentPage === id ? (
              <div
                className="w-9 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
              >
                <Icon size={16} strokeWidth={2.2} className="text-white" />
              </div>
            ) : (
              <div className="w-9 h-7 flex items-center justify-center">
                <Icon size={19} strokeWidth={1.8} className="text-zinc-500" />
              </div>
            )}
            <span className={`text-[9.5px] font-medium leading-none ${currentPage === id ? 'text-white' : 'text-zinc-500'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
