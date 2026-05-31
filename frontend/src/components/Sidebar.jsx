import { LayoutDashboard, ArrowLeftRight, Target, CreditCard, CalendarCheck, Sparkles } from 'lucide-react'

const nav = [
  { id: 'dashboard',    label: 'Início',      Icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos', Icon: ArrowLeftRight  },
  { id: 'fixedbills',   label: 'Contas',      Icon: CalendarCheck   },
  { id: 'goals',        label: 'Metas',       Icon: Target          },
  { id: 'debts',        label: 'Dívidas',     Icon: CreditCard      },
  { id: 'ai',           label: 'Fin',         Icon: Sparkles        },
]

export default function BottomNav({ currentPage, onNavigate }) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 pb-safe">
      <div
        className="mx-3 mb-3 rounded-[26px] px-1.5 py-1.5 flex"
        style={{
          background: 'rgba(15, 15, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {nav.map(({ id, label, Icon }) => {
          const active = currentPage === id
          const isAi = id === 'ai'
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1 min-h-[44px] justify-center relative"
            >
              {active ? (
                <div
                  className="w-9 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
                    boxShadow: '0 4px 12px var(--grad-glow)',
                  }}
                >
                  <Icon size={15} strokeWidth={2.3} className="text-white" />
                </div>
              ) : (
                <div className="w-9 h-7 flex items-center justify-center relative">
                  <Icon size={19} strokeWidth={1.7} style={{ color: 'var(--text-dim)' }} />
                  {isAi && (
                    <span
                      className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full badge-online"
                      style={{ background: 'var(--success)' }}
                    />
                  )}
                </div>
              )}
              <span
                className="text-[9.5px] font-semibold leading-none"
                style={{ color: active ? 'white' : 'var(--text-dim)' }}
              >
                {label}
              </span>
              {active && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: 'var(--primary-light)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
