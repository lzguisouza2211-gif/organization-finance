import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Receipt, Trash2,
         ShoppingCart, Car, Home, Heart, Film, BookOpen,
         Banknote, Zap, Utensils, ShoppingBag, Briefcase, Gift } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
const curMonth = () => new Date().toISOString().slice(0, 7)
const today    = () => new Date().toISOString().slice(0, 10)

const EMPTY = { date: today(), amount: '', type: 'expense', category_id: '', description: '' }

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--grad-to)]'
const labelCls = 'block text-[12px] font-semibold text-zinc-400 mb-1.5'

const CAT_ICONS = {
  Alimentação:  ShoppingCart,
  Transporte:   Car,
  Moradia:      Home,
  Saúde:        Heart,
  Lazer:        Film,
  Educação:     BookOpen,
  Salário:      Banknote,
  Energia:      Zap,
  Restaurante:  Utensils,
  Compras:      ShoppingBag,
  Trabalho:     Briefcase,
  Presente:     Gift,
}

function getCatIcon(name) {
  if (!name) return Receipt
  for (const [key, Icon] of Object.entries(CAT_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return Icon
  }
  return Receipt
}

export default function Transactions({ refreshKey }) {
  const [month,        setMonth]        = useState(curMonth)
  const [transactions, setTransactions] = useState([])
  const [categories,   setCategories]   = useState([])
  const [showModal,    setShowModal]    = useState(false)
  const [form,         setForm]         = useState(EMPTY)
  const [saving,       setSaving]       = useState(false)

  useEffect(() => { api.getCategories().then(setCategories) }, [])
  useEffect(() => { api.getTransactions(month).then(setTransactions) }, [month, refreshKey])

  const filtered = categories.filter(c => c.type === form.type || c.type === 'both')
  const field    = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const tx = await api.createTransaction({ ...form, amount: parseFloat(form.amount) })
      if (month === form.date.slice(0, 7)) setTransactions(p => [tx, ...p])
      setShowModal(false)
      setForm(EMPTY)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Excluir esta transação?')) return
    await api.deleteTransaction(id)
    setTransactions(p => p.filter(t => t.id !== id))
  }

  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance  = income - expenses

  // Group by date
  const groups = transactions.reduce((acc, tx) => {
    const d = tx.date
    if (!acc[d]) acc[d] = []
    acc[d].push(tx)
    return acc
  }, {})
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

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

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-extrabold text-white">Lançamentos</h1>
        <button
          onClick={() => { setForm(EMPTY); setShowModal(true) }}
          className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
        >
          + Nova
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 active:bg-white/10">
          <ChevronLeft size={16} />
        </button>
        <span className="text-[13px] font-semibold text-white capitalize w-36 text-center">{monthLabel}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 active:bg-white/10">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-emerald-400 mb-0.5">Receitas</p>
          <p className="text-[14px] font-bold text-emerald-400 tabular-nums leading-none">{fmt(income)}</p>
        </div>
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-rose-400 mb-0.5">Gastos</p>
          <p className="text-[14px] font-bold text-rose-400 tabular-nums leading-none">{fmt(expenses)}</p>
        </div>
        <div className={`rounded-2xl px-3 py-2.5 border ${balance >= 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
          <p className={`text-[10px] font-semibold mb-0.5 ${balance >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>Saldo</p>
          <p className={`text-[14px] font-bold tabular-nums leading-none ${balance >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Grouped list */}
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <Receipt size={40} className="mb-3" />
          <p className="text-sm">Nenhuma transação neste mês</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide mb-2">
                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-2">
                {groups[date].map(tx => (
                  <SwipeRow key={tx.id} tx={tx} onDelete={() => remove(tx.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet form */}
      {showModal && (
        <Modal title="Nova Transação" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value, category_id: '' }))}
                  className={inputCls}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Data</label>
                <input type="date" value={form.date} onChange={field('date')} required className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Valor (R$)</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={field('amount')} required placeholder="0,00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Categoria</label>
              <select value={form.category_id} onChange={field('category_id')} required className={inputCls}>
                <option value="">Selecione...</option>
                {filtered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Descrição</label>
              <input type="text" value={form.description} onChange={field('description')} placeholder="Ex: Supermercado" className={inputCls} />
            </div>
            <button
              type="submit" disabled={saving}
              className="w-full py-3.5 rounded-2xl text-white font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 20px var(--grad-glow)' }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function SwipeRow({ tx, onDelete }) {
  const [swipeX,   setSwipeX]   = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const CatIcon = getCatIcon(tx.category_name)

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX
    setDragging(true)
  }
  const onTouchMove = (e) => {
    if (!dragging) return
    const dx = Math.min(0, Math.max(-76, e.touches[0].clientX - startX.current))
    setSwipeX(dx)
  }
  const onTouchEnd = () => {
    setDragging(false)
    setSwipeX(swipeX < -38 ? -76 : 0)
  }

  const onMouseDown = (e) => {
    startX.current = e.clientX
    setDragging(true)
  }
  const onMouseMove = (e) => {
    if (!dragging) return
    const dx = Math.min(0, Math.max(-76, e.clientX - startX.current))
    setSwipeX(dx)
  }
  const onMouseUp = () => {
    setDragging(false)
    setSwipeX(swipeX < -38 ? -76 : 0)
  }

  const isIncome = tx.type === 'income'

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Delete zone */}
      <button
        onClick={onDelete}
        className="absolute inset-y-0 right-0 w-[76px] bg-rose-600 flex items-center justify-center rounded-r-2xl"
      >
        <Trash2 size={20} className="text-white" />
      </button>

      {/* Row */}
      <div
        className="relative bg-[#131318] rounded-2xl px-4 py-3.5 flex items-center gap-3 select-none"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {/* Category icon */}
        <div
          className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center"
          style={{ backgroundColor: (tx.category_color || '#6366f1') + '25' }}
        >
          <CatIcon size={18} style={{ color: tx.category_color || '#6366f1' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-white truncate">{tx.description || '—'}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
            {tx.category_name || '—'} · {fmtDate(tx.date)}
          </p>
        </div>

        {/* Amount */}
        <p className={`text-[15px] font-bold tabular-nums shrink-0 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isIncome ? '+' : '−'}{fmt(tx.amount)}
        </p>
      </div>
    </div>
  )
}
