import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Bell, TrendingUp, TrendingDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const currentMonth = () => new Date().toISOString().slice(0, 7)

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Dashboard({ refreshKey }) {
  const { session } = useAuth()
  const [month,   setMonth]   = useState(currentMonth)
  const [data,    setData]    = useState({ income: 0, expenses: 0, balance: 0, byCategory: [] })
  const [loading, setLoading] = useState(true)

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

  const saved = data.income > 0 ? Math.round((1 - data.expenses / data.income) * 100) : 0

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-bold text-base shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 font-medium leading-none mb-0.5">{greeting()}</p>
            <p className="text-[15px] font-bold text-white leading-none">{name}</p>
          </div>
        </div>
        <button className="relative w-10 h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400">
          <Bell size={18} />
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 active:bg-white/10">
          <ChevronLeft size={16} />
        </button>
        <span className="text-[14px] font-semibold text-white capitalize w-36 text-center">{monthLabel}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 active:bg-white/10">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Hero balance card */}
      <div
        className="rounded-[28px] p-6 mb-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(140deg, var(--grad-from), var(--grad-to))',
          boxShadow: '0 16px 48px var(--grad-glow)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-[0.08]" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white opacity-[0.05]" />

        <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wide mb-2 relative">Saldo do mês</p>
        <p className="text-[40px] font-extrabold text-white tabular-nums leading-none relative mb-3">
          {loading ? '—' : fmt(data.balance)}
        </p>
        <div className="flex gap-2 relative">
          <span className="text-[11px] font-bold text-white/80 bg-white/15 rounded-full px-3 py-1 whitespace-nowrap">
            {saved > 0 ? `${saved}% poupado` : 'Sem economia'}
          </span>
        </div>
      </div>

      {/* Mini cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-[22px] bg-zinc-900/60 border border-white/8 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Receitas</span>
          </div>
          <p className="text-[22px] font-bold text-emerald-400 tabular-nums leading-none">
            {loading ? '—' : fmt(data.income)}
          </p>
        </div>
        <div className="rounded-[22px] bg-zinc-900/60 border border-white/8 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <TrendingDown size={14} className="text-rose-400" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Gastos</span>
          </div>
          <p className="text-[22px] font-bold text-rose-400 tabular-nums leading-none">
            {loading ? '—' : fmt(data.expenses)}
          </p>
        </div>
      </div>

      {/* Category donut card */}
      <div className="rounded-[22px] bg-zinc-900/60 border border-white/8 p-5">
        <p className="text-[13px] font-bold text-white mb-4">Gastos por Categoria</p>
        {loading ? (
          <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">Carregando...</div>
        ) : data.byCategory.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
            Nenhum gasto registrado
          </div>
        ) : (
          <DonutChart categories={data.byCategory} total={data.expenses} />
        )}
      </div>
    </div>
  )
}

function DonutChart({ categories, total }) {
  const r   = 50
  const sw  = 14
  const sz  = 128
  const cx  = sz / 2
  const circ = 2 * Math.PI * r
  const top5 = categories.slice(0, 5)

  let accum = 0
  const segs = top5.map(cat => {
    const len  = total > 0 ? (cat.total / total) * circ : 0
    const seg  = {
      color:       cat.color,
      dasharray:   `${len} ${circ}`,
      dashoffset:  -accum,
      name:        cat.name,
      pct:         total > 0 ? Math.round((cat.total / total) * 100) : 0,
      total:       cat.total,
    }
    accum += len
    return seg
  })

  return (
    <div className="flex gap-4 items-center">
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: sz, height: sz }}>
        <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#27272a" strokeWidth={sw} />
          {segs.map((seg, i) => (
            <circle
              key={i}
              cx={cx} cy={cx} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wide">GASTOS</span>
          <span className="text-[13px] font-bold text-white tabular-nums leading-tight">{fmt(total)}</span>
          <span className="text-[9px] text-zinc-600">{top5.length} categ.</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5 min-w-0">
        {segs.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center"
              style={{ backgroundColor: seg.color + '25' }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[12px] text-zinc-300 truncate">{seg.name}</span>
                <span className="text-[11px] text-zinc-500 shrink-0">{seg.pct}%</span>
              </div>
              <span className="text-[11px] font-semibold text-white tabular-nums">{fmt(seg.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
