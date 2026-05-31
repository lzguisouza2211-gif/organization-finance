import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Receipt, Trash2, Pencil,
         ShoppingCart, Car, Home, Heart, Film, BookOpen,
         Banknote, Zap, Utensils, ShoppingBag, Briefcase, Gift } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'
import { SkeletonList } from '../components/Skeleton'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
const curMonth = () => new Date().toISOString().slice(0, 7)
const today    = () => new Date().toISOString().slice(0, 10)

const EMPTY = { date: today(), amount: '', type: 'expense', category_id: '', description: '' }

const inputCls = 'w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder-[var(--text-dim)] focus:outline-none transition-all'
const labelCls = 'block text-[12px] font-semibold mb-1.5'

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
  const [editing,      setEditing]      = useState(null)
  const [form,         setForm]         = useState(EMPTY)
  const [saving,       setSaving]       = useState(false)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => { api.getCategories().then(setCategories) }, [])
  useEffect(() => {
    setLoading(true)
    api.getTransactions(month).then(setTransactions).finally(() => setLoading(false))
  }, [month, refreshKey])

  const filtered = categories.filter(c => c.type === form.type || c.type === 'both')
  const field    = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const openEdit = (tx) => {
    setEditing(tx)
    setForm({ date: tx.date, amount: String(tx.amount), type: tx.type, category_id: tx.category_id || '', description: tx.description || '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editing) {
        const tx = await api.updateTransaction(editing.id, payload)
        setTransactions(p => p.map(t => t.id === editing.id ? tx : t))
      } else {
        const tx = await api.createTransaction(payload)
        if (month === form.date.slice(0, 7)) setTransactions(p => [tx, ...p])
      }
      setShowModal(false)
      setForm(EMPTY)
      setEditing(null)
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
    <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-extrabold text-white">Lançamentos</h1>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY); setShowModal(true) }}
          className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5 btn-press ripple-wrapper"
          style={{
            background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
            boxShadow: '0 4px 16px var(--grad-glow)',
          }}
        >
          + Nova
        </button>
      </div>

      {/* Month picker */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center btn-press"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={15} style={{ color: 'var(--text-dim)' }} />
        </button>
        <span className="text-[13px] font-semibold text-white capitalize w-36 text-center">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center btn-press"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <ChevronRight size={15} style={{ color: 'var(--text-dim)' }} />
        </button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="rounded-2xl px-3 py-2.5" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p className="text-[10px] font-semibold text-emerald-400 mb-0.5">Receitas</p>
          <p className="text-[14px] font-bold text-emerald-400 tabular-nums leading-none">{fmt(income)}</p>
        </div>
        <div className="rounded-2xl px-3 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-[10px] font-semibold text-rose-400 mb-0.5">Gastos</p>
          <p className="text-[14px] font-bold text-rose-400 tabular-nums leading-none">{fmt(expenses)}</p>
        </div>
        <div
          className="rounded-2xl px-3 py-2.5"
          style={{
            background: balance >= 0 ? 'rgba(124,58,237,0.08)' : 'rgba(245,158,11,0.08)',
            border: balance >= 0 ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <p className="text-[10px] font-semibold mb-0.5" style={{ color: balance >= 0 ? 'var(--primary-light)' : 'var(--warning)' }}>Saldo</p>
          <p className="text-[14px] font-bold tabular-nums leading-none" style={{ color: balance >= 0 ? 'var(--primary-light)' : 'var(--warning)' }}>{fmt(balance)}</p>
        </div>
      </div>

      {/* Grouped list */}
      {loading ? (
        <SkeletonList rows={4} />
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-dim)' }}>
          <Receipt size={40} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhuma transação neste mês</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((date, di) => {
            const dayTotal = groups[date].reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : -tx.amount), 0)
            return (
              <div key={date} className="stagger-item" style={{ animationDelay: `${di * 40}ms` }}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-dim)' }}>
                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <span className={`text-[11px] font-bold ${dayTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dayTotal >= 0 ? '+' : ''}{fmt(dayTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {groups[date].map(tx => (
                    <SwipeRow key={tx.id} tx={tx} onDelete={() => remove(tx.id)} onEdit={() => openEdit(tx)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Editar Transação' : 'Nova Transação'} onClose={() => { setShowModal(false); setEditing(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            {/* Type toggle */}
            <div className="flex rounded-2xl overflow-hidden p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              {['expense', 'income'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
                  className="flex-1 py-2 rounded-xl text-[13px] font-bold transition-all duration-200"
                  style={form.type === t
                    ? { background: t === 'expense' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: t === 'expense' ? '#F87171' : '#34D399', border: `1px solid ${t === 'expense' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }
                    : { color: 'var(--text-dim)' }
                  }
                >
                  {t === 'expense' ? 'Gasto' : 'Receita'}
                </button>
              ))}
            </div>

            <div>
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Data</label>
              <input
                type="date" value={form.date} onChange={field('date')} required
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Valor (R$)</label>
              <input
                type="number" step="0.01" min="0.01" value={form.amount} onChange={field('amount')} required placeholder="0,00"
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Categoria</label>
              <select
                value={form.category_id} onChange={field('category_id')} required
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              >
                <option value="">Selecione...</option>
                {filtered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Descrição</label>
              <input
                type="text" value={form.description} onChange={field('description')} placeholder="Ex: Supermercado"
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              />
            </div>
            <button
              type="submit" disabled={saving}
              className="w-full py-3.5 rounded-2xl text-white font-bold disabled:opacity-50 btn-press ripple-wrapper"
              style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 20px var(--grad-glow)' }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : 'Salvar'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function SwipeRow({ tx, onDelete, onEdit }) {
  const [swipeX,   setSwipeX]   = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const CatIcon = getCatIcon(tx.category_name)
  const isIncome = tx.type === 'income'
  const SNAP = 152

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setDragging(true) }
  const onTouchMove  = (e) => {
    if (!dragging) return
    setSwipeX(Math.min(0, Math.max(-SNAP, e.touches[0].clientX - startX.current)))
  }
  const onTouchEnd = () => { setDragging(false); setSwipeX(swipeX < -SNAP / 2 ? -SNAP : 0) }

  const onMouseDown = (e) => { startX.current = e.clientX; setDragging(true) }
  const onMouseMove = (e) => {
    if (!dragging) return
    setSwipeX(Math.min(0, Math.max(-SNAP, e.clientX - startX.current)))
  }
  const onMouseUp = () => { setDragging(false); setSwipeX(swipeX < -SNAP / 2 ? -SNAP : 0) }

  return (
    <div
      className="relative rounded-2xl overflow-hidden group"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Action zone (edit + delete) revealed on swipe */}
      <div className="absolute inset-y-0 right-0 flex" style={{ width: SNAP }}>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center"
          style={{ background: '#4F46E5' }}
        >
          <Pencil size={18} className="text-white" />
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center rounded-r-2xl"
          style={{ background: 'var(--danger)' }}
        >
          <Trash2 size={18} className="text-white" />
        </button>
      </div>

      {/* Desktop buttons on hover */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity items-center hidden sm:flex">
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.25)' }}
        >
          <Pencil size={13} className="text-indigo-400" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <Trash2 size={13} className="text-rose-400" />
        </button>
      </div>

      {/* Row */}
      <div
        className="relative rounded-2xl px-4 py-3.5 flex items-center gap-3 select-none"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          transform: `translateX(${swipeX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        <div
          className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center"
          style={{ backgroundColor: (tx.category_color || '#7C3AED') + '22' }}
        >
          <CatIcon size={18} style={{ color: tx.category_color || '#7C3AED' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-white truncate">{tx.description || '—'}</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
            {tx.category_name || '—'} · {fmtDate(tx.date)}
          </p>
        </div>
        <p className={`text-[15px] font-bold tabular-nums shrink-0 sm:mr-20 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isIncome ? '+' : '−'}{fmt(tx.amount)}
        </p>
      </div>
    </div>
  )
}
