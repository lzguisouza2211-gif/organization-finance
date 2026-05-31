import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Eye, EyeOff, Bell, PiggyBank, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import AnimatedNumber from '../components/AnimatedNumber'
import ProgressBar from '../components/ProgressBar'
import { Skeleton } from '../components/Skeleton'

const fmt    = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const curMon = () => new Date().toISOString().slice(0, 7)

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Dashboard({ refreshKey }) {
  const { session } = useAuth()
  const [month,   setMonth]   = useState(curMon)
  const [data,    setData]    = useState({ income: 0, expenses: 0, balance: 0, byCategory: [], goals: [] })
  const [loading, setLoading] = useState(true)
  const [hidden,  setHidden]  = useState(false)

  const name = session?.user?.email?.split('@')[0] || 'Você'

  useEffect(() => {
    setLoading(true)
    api.getDashboard(month)
      .then(setData)
      .finally(() => setLoading(false))
  }, [month, refreshKey])

  const prevMonth = () => {
    const d = new Date(month + '-02')
    d.setMonth(d.getMonth() - 1)
    setMonth(d.toISOString().slice(0, 7))
  }
  const nextMonth = () => {
    const d = new Date(month + '-02')
    d.setMonth(d.getMonth() + 1)
    setMonth(d.toISOString().slice(0, 7))
  }
  const monthLabel = new Date(month + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const saved      = data.income > 0 ? Math.round((1 - data.expenses / data.income) * 100) : 0

  return (
    <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
              boxShadow: '0 4px 16px var(--grad-glow)',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-medium leading-none mb-0.5" style={{ color: 'var(--text-dim)' }}>{greeting()}</p>
            <p className="text-[15px] font-bold text-white leading-none">{name}</p>
          </div>
        </div>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Bell size={17} style={{ color: 'var(--text-dim)' }} />
        </button>
      </div>

      {/* Month selector (mobile) */}
      <div className="flex items-center justify-center gap-3 mb-4 sm:hidden">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors btn-press"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={15} style={{ color: 'var(--text-dim)' }} />
        </button>
        <span className="text-[14px] font-semibold text-white capitalize w-36 text-center">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors btn-press"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <ChevronRight size={15} style={{ color: 'var(--text-dim)' }} />
        </button>
      </div>

      {/* ── Mobile layout ── */}
      <div className="sm:hidden space-y-4">
        <HeroCard data={data} loading={loading} saved={saved} hidden={hidden} onToggleHidden={() => setHidden(h => !h)} />
        <MiniCards data={data} loading={loading} hidden={hidden} />
        <DonutCard data={data} loading={loading} />
        {(loading || data.goals.length > 0) && <GoalsCard goals={data.goals} loading={loading} />}
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden sm:block space-y-5">
        {/* Month nav + top row */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors btn-press"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ChevronLeft size={15} style={{ color: 'var(--text-dim)' }} />
          </button>
          <span className="text-[15px] font-semibold text-white capitalize">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors btn-press"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <ChevronRight size={15} style={{ color: 'var(--text-dim)' }} />
          </button>
        </div>

        {/* Hero + Goals side by side */}
        <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
          <div className="space-y-5">
            <HeroCard data={data} loading={loading} saved={saved} hidden={hidden} onToggleHidden={() => setHidden(h => !h)} />
            <MiniCards data={data} loading={loading} hidden={hidden} />
          </div>
          {(loading || data.goals.length > 0) && (
            <GoalsCard goals={data.goals} loading={loading} />
          )}
        </div>

        {/* Full-width donut chart */}
        <DonutCard data={data} loading={loading} large />
      </div>
    </div>
  )
}

function HeroCard({ data, loading, saved, hidden, onToggleHidden }) {
  return (
    <div
      className="rounded-[28px] p-6 relative overflow-hidden stagger-item"
      style={{
        background: 'linear-gradient(140deg, var(--grad-from), var(--grad-to))',
        boxShadow: '0 16px 48px var(--grad-glow)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white opacity-[0.07] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white opacity-[0.04] pointer-events-none" />

      <div className="flex items-center justify-between mb-2 relative">
        <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">Saldo do mês</p>
        <button
          onClick={onToggleHidden}
          className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 transition-colors hover:bg-white/20"
        >
          {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>

      <div className="relative mb-4">
        {loading ? (
          <Skeleton className="h-12 w-48 rounded-xl" />
        ) : hidden ? (
          <p className="text-[40px] font-extrabold text-white tabular-nums leading-none tracking-tight">••••••</p>
        ) : (
          <AnimatedNumber
            value={data.balance || 0}
            format={fmt}
            className="text-[40px] font-extrabold text-white tabular-nums leading-none tracking-tight"
          />
        )}
      </div>

      <div className="flex items-center gap-2 relative">
        <span className="text-[11px] font-bold text-white/80 bg-white/15 rounded-full px-3 py-1 whitespace-nowrap">
          {saved > 0 ? `${saved}% poupado` : 'Sem economia este mês'}
        </span>
      </div>
    </div>
  )
}

function MiniCards({ data, loading, hidden }) {
  const cards = [
    { label: 'Receitas', value: data.income,   color: 'emerald', Icon: TrendingUp,   textCls: 'text-emerald-400' },
    { label: 'Gastos',   value: data.expenses, color: 'rose',    Icon: TrendingDown, textCls: 'text-rose-400'    },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 stagger-item" style={{ animationDelay: '50ms' }}>
      {cards.map(({ label, value, color, Icon, textCls }) => (
        <div
          key={label}
          className="rounded-[22px] p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-xl bg-${color}-500/15 flex items-center justify-center`}>
              <Icon size={14} className={textCls} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>{label}</span>
          </div>
          {loading ? (
            <Skeleton className="h-7 w-28 rounded-lg" />
          ) : hidden ? (
            <p className={`text-[22px] font-bold tabular-nums leading-none ${textCls}`}>••••</p>
          ) : (
            <AnimatedNumber value={value} format={fmt} className={`text-[22px] font-bold tabular-nums leading-none ${textCls}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function DonutCard({ data, loading, large = false }) {
  return (
    <div
      className="rounded-[22px] p-5 stagger-item"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '100ms' }}
    >
      <p className="text-[13px] font-bold text-white mb-4">Gastos por Categoria</p>
      {loading ? (
        <div className="flex gap-4 items-center">
          <Skeleton className="w-32 h-32 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </div>
      ) : data.byCategory.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'var(--text-dim)' }}>
          Nenhum gasto registrado
        </div>
      ) : (
        <DonutChart categories={data.byCategory} total={data.expenses} large={large} />
      )}
    </div>
  )
}

function GoalsCard({ goals, loading }) {
  const top = goals.slice(0, 4)
  return (
    <div
      className="rounded-[22px] p-5 stagger-item"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '150ms' }}
    >
      <p className="text-[13px] font-bold text-white mb-4">Minhas Metas</p>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-3">
          {top.map((g, i) => {
            const pct  = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
            const done = pct >= 100
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: done ? 'rgba(16,185,129,0.15)' : 'var(--surface-2)' }}
                >
                  {done
                    ? <CheckCircle2 size={15} className="text-emerald-400" />
                    : <PiggyBank size={15} style={{ color: 'var(--text-dim)' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-white/80 truncate">{g.name}</span>
                    <span className="text-[11px] ml-2 shrink-0 tabular-nums" style={{ color: 'var(--text-dim)' }}>{Math.round(pct)}%</span>
                  </div>
                  <ProgressBar value={pct} color={done ? 'success' : 'gradient'} height="h-1.5" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DonutChart({ categories, total, large = false }) {
  const sz   = large ? 220 : 128
  const r    = large ? 88  : 50
  const sw   = large ? 20  : 13
  const cx   = sz / 2
  const circ = 2 * Math.PI * r
  const topN = categories.slice(0, large ? 8 : 5)

  let accum = 0
  const segs = topN.map(cat => {
    const len = total > 0 ? (cat.total / total) * circ : 0
    const seg = {
      color:      cat.color,
      dasharray:  `${len} ${circ}`,
      dashoffset: -accum,
      name:       cat.name,
      pct:        total > 0 ? Math.round((cat.total / total) * 100) : 0,
      total:      cat.total,
    }
    accum += len
    return seg
  })

  return (
    <div className={`flex gap-6 items-center ${large ? 'sm:gap-10' : ''}`}>
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: sz, height: sz }}>
        <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border-2)" strokeWidth={sw} />
          {segs.map((seg, i) => (
            <circle
              key={i}
              cx={cx} cy={cx} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.7s ease, stroke-dashoffset 0.7s ease' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-semibold uppercase tracking-wide ${large ? 'text-[11px]' : 'text-[9px]'}`} style={{ color: 'var(--text-dim)' }}>GASTOS</span>
          <span className={`font-bold text-white tabular-nums leading-tight ${large ? 'text-[17px]' : 'text-[13px]'}`}>{fmt(total)}</span>
          <span className={large ? 'text-[11px]' : 'text-[9px]'} style={{ color: 'var(--text-dim)' }}>{topN.length} categ.</span>
        </div>
      </div>

      {/* Legend */}
      <div className={`flex-1 min-w-0 ${large ? 'grid sm:grid-cols-2 gap-x-6 gap-y-3' : 'space-y-2'}`}>
        {segs.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 stagger-item" style={{ animationDelay: `${i * 50}ms` }}>
            <div
              className={`rounded-xl shrink-0 flex items-center justify-center ${large ? 'w-9 h-9' : 'w-7 h-7'}`}
              style={{ backgroundColor: seg.color + '22' }}
            >
              <div className={`rounded-full ${large ? 'w-3 h-3' : 'w-2 h-2'}`} style={{ backgroundColor: seg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-white/80 truncate ${large ? 'text-[14px]' : 'text-[12px]'}`}>{seg.name}</span>
                <span className={`shrink-0 font-semibold ${large ? 'text-[13px]' : 'text-[11px]'}`} style={{ color: 'var(--text-dim)' }}>{seg.pct}%</span>
              </div>
              <ProgressBar value={seg.pct} height={large ? 'h-1.5' : 'h-1'} className="mt-1" />
              {large && (
                <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-dim)' }}>{fmt(seg.total)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
