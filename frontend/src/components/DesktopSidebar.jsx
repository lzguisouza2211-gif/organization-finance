import { LayoutDashboard, ArrowLeftRight, Target, CreditCard, CalendarCheck, Sparkles, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const nav = [
  { id: 'dashboard',    label: 'Início',      Icon: LayoutDashboard },
  { id: 'transactions', label: 'Lançamentos', Icon: ArrowLeftRight  },
  { id: 'fixedbills',   label: 'Contas',      Icon: CalendarCheck   },
  { id: 'goals',        label: 'Metas',       Icon: Target          },
  { id: 'debts',        label: 'Dívidas',     Icon: CreditCard      },
  { id: 'ai',           label: 'Fin',         Icon: Sparkles        },
]

export default function DesktopSidebar({ currentPage, onNavigate }) {
  const { session } = useAuth()
  const name = session?.user?.email?.split('@')[0] || 'Você'
  const initial = name.charAt(0).toUpperCase()

  return (
    <aside
      className="shrink-0 flex flex-col h-[100dvh] sticky top-0 overflow-hidden transition-all duration-200"
      style={{
        width: 'clamp(72px, 14vw, 220px)',
        background: '#0F0F1A',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo / Avatar */}
      <div className="px-4 pt-6 pb-5 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[12px] flex items-center justify-center text-white font-black text-sm shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
              boxShadow: '0 4px 12px var(--grad-glow)',
            }}
          >
            {initial}
          </div>
          <div className="min-w-0 hidden xl:block" style={{ width: 'max(0px, calc(14vw - 72px))' }}>
            <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>Finanças Pessoais</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {nav.map(({ id, label, Icon }) => {
          const active = currentPage === id
          const isAi = id === 'ai'
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 ${
                active
                  ? 'text-white'
                  : 'text-[var(--text-dim)] hover:text-white hover:bg-[var(--surface-2)]'
              } ${active ? 'active' : ''}`}
              style={active
                ? {
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.15))',
                    boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.3)',
                  }
                : {}
              }
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={active
                  ? { background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 12px var(--grad-glow)' }
                  : isAi
                    ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(124,58,237,0.2)' }
                    : { background: 'rgba(255,255,255,0.05)' }
                }
              >
                <Icon
                  size={15}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? 'text-white' : isAi ? 'text-purple-400' : 'text-[var(--text-dim)]'}
                />
              </div>
              <span className="hidden xl:block truncate">{label}</span>
              {isAi && !active && (
                <span
                  className="hidden xl:flex w-1.5 h-1.5 rounded-full ml-auto shrink-0 badge-online"
                  style={{ background: 'var(--success)' }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout + version */}
      <div className="px-2 py-4 border-t border-[var(--border)] shrink-0 space-y-1">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-semibold text-[var(--text-dim)] hover:text-rose-400 hover:bg-rose-500/8 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
            <LogOut size={15} strokeWidth={1.8} />
          </div>
          <span className="hidden xl:block">Sair</span>
        </button>
        <p className="hidden xl:block text-center text-[10px] text-[var(--text-dim)] opacity-40 pt-1">v1.0.0</p>
      </div>
    </aside>
  )
}
