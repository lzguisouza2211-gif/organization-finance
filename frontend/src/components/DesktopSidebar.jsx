import { LayoutDashboard, ArrowLeftRight, Target, CreditCard, CalendarCheck, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { id: 'dashboard',    label: 'Início',      Icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos', Icon: ArrowLeftRight  },
  { id: 'fixedbills',   label: 'Contas',      Icon: CalendarCheck   },
  { id: 'goals',        label: 'Metas',       Icon: Target          },
  { id: 'debts',        label: 'Dívidas',     Icon: CreditCard      },
]

export default function DesktopSidebar({ currentPage, onNavigate }) {
  const { session } = useAuth()
  const name = session?.user?.email?.split('@')[0] || 'Você'

  return (
    <aside className="w-56 shrink-0 bg-[#0a0a0d] border-r border-white/6 flex flex-col h-[100dvh] sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[12px] flex items-center justify-center text-white font-black text-base shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
            <p className="text-zinc-500 text-xs">Finanças Pessoais</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {nav.map(({ id, label, Icon }) => {
          const active = currentPage === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all ${
                active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              }`}
              style={active ? { background: 'rgba(99,102,241,0.15)' } : {}}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={active
                  ? { background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }
                  : { background: 'rgba(255,255,255,0.05)' }
                }
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} className={active ? 'text-white' : 'text-zinc-500'} />
              </div>
              {label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/6 shrink-0">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-semibold text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <LogOut size={15} strokeWidth={1.8} />
          </div>
          Sair
        </button>
      </div>
    </aside>
  )
}
