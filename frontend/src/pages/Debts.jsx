import { useState, useEffect } from 'react'
import { Pencil, Trash2, CreditCard, CheckCircle2 } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import AnimatedNumber from '../components/AnimatedNumber'
import { SkeletonCard } from '../components/Skeleton'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

const EMPTY = { name: '', total_amount: '', paid_amount: '', installments: '', due_date: '' }

const inputCls = 'w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder-[var(--text-dim)] focus:outline-none transition-all'
const labelCls = 'block text-[12px] font-semibold mb-1.5'

export default function Debts({ refreshKey }) {
  const [debts,     setDebts]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getDebts().then(setDebts).finally(() => setLoading(false))
  }, [refreshKey])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (d) => {
    setEditing(d)
    setForm({ name: d.name, total_amount: d.total_amount, paid_amount: d.paid_amount, installments: d.installments || '', due_date: d.due_date || '' })
    setShowModal(true)
  }

  const field = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        name:         form.name,
        total_amount: parseFloat(form.total_amount),
        paid_amount:  parseFloat(form.paid_amount) || 0,
        installments: form.installments ? parseInt(form.installments) : null,
        due_date:     form.due_date || null,
      }
      if (editing) {
        const updated = await api.updateDebt(editing.id, data)
        setDebts(p => p.map(d => d.id === editing.id ? updated : d))
      } else {
        const created = await api.createDebt(data)
        setDebts(p => [...p, created])
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Excluir esta dívida?')) return
    await api.deleteDebt(id)
    setDebts(p => p.filter(d => d.id !== id))
  }

  const totalDebt    = debts.reduce((s, d) => s + d.total_amount, 0)
  const totalPaid    = debts.reduce((s, d) => s + d.paid_amount,  0)
  const totalRemains = totalDebt - totalPaid
  const heroProgress = totalDebt > 0 ? Math.min((totalPaid / totalDebt) * 100, 100) : 0

  return (
    <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-extrabold text-white">Dívidas</h1>
        <button
          onClick={openAdd}
          className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5 btn-press ripple-wrapper"
          style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
        >
          + Nova
        </button>
      </div>

      {/* Hero card */}
      {!loading && debts.length > 0 && (
        <div
          className="rounded-[28px] p-6 mb-5 relative overflow-hidden stagger-item"
          style={{ background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.08] pointer-events-none"
            style={{ background: 'var(--danger)' }} />
          <p className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>
            Saldo devedor total
          </p>
          <AnimatedNumber
            value={totalRemains}
            format={fmt}
            className="text-[32px] font-extrabold text-rose-400 tabular-nums leading-none mb-3 block"
          />
          <div className="flex justify-between text-[11px] mb-2" style={{ color: 'var(--text-dim)' }}>
            <span>Pago: <span className="text-emerald-400 font-bold">{fmt(totalPaid)}</span></span>
            <span className="font-bold">{Math.round(heroProgress)}%</span>
          </div>
          <ProgressBar value={heroProgress} color="success" />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="sm:grid sm:grid-cols-2 sm:gap-4 space-y-3 sm:space-y-0">
          <SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Empty */}
      {!loading && debts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-dim)' }}>
          <CreditCard size={48} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhuma dívida cadastrada</p>
        </div>
      )}

      {/* Debts grid */}
      {!loading && debts.length > 0 && (
        <div className="sm:grid sm:grid-cols-2 sm:gap-4 space-y-3 sm:space-y-0">
          {debts.map((debt, i) => {
            const progress   = Math.min((debt.paid_amount / debt.total_amount) * 100, 100)
            const quitado    = progress >= 100
            const remaining  = Math.max(debt.total_amount - debt.paid_amount, 0)
            const paidInst   = debt.installments
              ? Math.round((debt.paid_amount / debt.total_amount) * debt.installments)
              : 0

            return (
              <div
                key={debt.id}
                className="rounded-[22px] p-5 transition-all duration-200 group stagger-item"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${quitado ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                  animationDelay: `${i * 50}ms`,
                }}
                onMouseEnter={e => !quitado && (e.currentTarget.style.boxShadow = '0 0 24px rgba(239,68,68,0.12)')}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: quitado ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)' }}
                    >
                      {quitado
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <CreditCard size={18} className="text-rose-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white leading-tight truncate">{debt.name}</p>
                      {debt.due_date && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          Vencimento: {fmtDate(debt.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(debt)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <Pencil size={13} style={{ color: 'var(--text-dim)' }} />
                    </button>
                    <button onClick={() => remove(debt.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <Trash2 size={13} className="text-rose-400" />
                    </button>
                  </div>
                </div>

                {/* Installment segments */}
                {debt.installments && debt.installments > 0 && (
                  <div className="mb-3">
                    <div className="flex gap-0.5 flex-wrap mb-1">
                      {Array.from({ length: Math.min(debt.installments, 24) }).map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full min-w-[4px] transition-all duration-500"
                          style={i < paidInst
                            ? { background: 'linear-gradient(90deg, var(--grad-from), var(--grad-to))' }
                            : { background: 'var(--border-2)' }
                          }
                        />
                      ))}
                    </div>
                    <p className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
                      {paidInst}/{debt.installments} pagas · faltam {debt.installments - paidInst}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    Pago: <span className="text-white font-bold">{fmt(debt.paid_amount)}</span>
                  </span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    {Math.round(progress)}%
                  </span>
                  <span className="text-[13px] tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    {fmt(debt.total_amount)}
                  </span>
                </div>

                <ProgressBar value={progress} color={quitado ? 'success' : 'danger'} className="mb-2" />

                <p className={`text-[11px] font-semibold ${quitado ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quitado ? 'Quitada!' : `restam ${fmt(remaining)}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Editar Dívida' : 'Nova Dívida'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Nome</label>
              <input type="text" value={form.name} onChange={field('name')} required
                placeholder="Ex: Financiamento do carro"
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Valor total (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.total_amount} onChange={field('total_amount')} required
                  placeholder="0,00"
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Valor pago (R$)</label>
                <input type="number" step="0.01" min="0" value={form.paid_amount} onChange={field('paid_amount')}
                  placeholder="0,00"
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Nº de parcelas</label>
                <input type="number" min="1" value={form.installments} onChange={field('installments')}
                  placeholder="Ex: 12"
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Vencimento</label>
                <input type="date" value={form.due_date} onChange={field('due_date')}
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
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
