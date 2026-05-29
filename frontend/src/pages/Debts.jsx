import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CreditCard, CheckCircle2 } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

const EMPTY = { name: '', total_amount: '', paid_amount: '', installments: '', due_date: '' }

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--grad-to)]'
const labelCls = 'block text-[12px] font-semibold text-zinc-400 mb-1.5'

export default function Debts({ refreshKey }) {
  const [debts,     setDebts]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { api.getDebts().then(setDebts) }, [refreshKey])

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
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-extrabold text-white">Dívidas</h1>
        <button
          onClick={openAdd}
          className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
        >
          + Nova
        </button>
      </div>

      {/* Hero card */}
      {debts.length > 0 && (
        <div className="rounded-[28px] bg-zinc-900/80 border border-white/8 p-6 mb-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-rose-500 opacity-[0.06]" />
          <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Saldo devedor total</p>
          <p className="text-[32px] font-extrabold text-rose-400 tabular-nums leading-none mb-3">{fmt(totalRemains)}</p>
          <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
            <span>Pago: <span className="text-emerald-400 font-bold">{fmt(totalPaid)}</span></span>
            <span>{Math.round(heroProgress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${heroProgress}%`,
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                boxShadow: '0 0 8px rgba(16,185,129,0.4)',
              }}
            />
          </div>
        </div>
      )}

      {/* Debts list */}
      {debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <CreditCard size={48} className="mb-3" />
          <p className="text-sm">Nenhuma dívida cadastrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map(debt => {
            const progress   = Math.min((debt.paid_amount / debt.total_amount) * 100, 100)
            const quitado    = progress >= 100
            const remaining  = Math.max(debt.total_amount - debt.paid_amount, 0)
            const paidInst   = debt.installments
              ? Math.round((debt.paid_amount / debt.total_amount) * debt.installments)
              : 0

            return (
              <div
                key={debt.id}
                className={`rounded-[22px] bg-zinc-900/70 border p-5 ${quitado ? 'border-emerald-500/30' : 'border-white/8'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quitado ? 'bg-emerald-500/20' : 'bg-rose-500/15'}`}>
                      {quitado
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <CreditCard size={18} className="text-rose-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white leading-tight truncate">{debt.name}</p>
                      {debt.due_date && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">Vencimento: {fmtDate(debt.due_date)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(debt)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 active:bg-white/10">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(debt.id)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 active:bg-rose-500/20">
                      <Trash2 size={13} />
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
                          className="h-1.5 flex-1 rounded-full min-w-[4px]"
                          style={i < paidInst
                            ? { background: 'linear-gradient(90deg, var(--grad-from), var(--grad-to))' }
                            : { background: 'rgba(255,255,255,0.1)' }
                          }
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 whitespace-nowrap">
                      {paidInst}/{debt.installments} pagas · faltam {debt.installments - paidInst}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-zinc-400 tabular-nums">
                    Pago: <span className="text-white font-bold">{fmt(debt.paid_amount)}</span>
                  </span>
                  <span className="text-[12px] font-bold text-zinc-500 tabular-nums">{Math.round(progress)}%</span>
                  <span className="text-[13px] text-zinc-500 tabular-nums">{fmt(debt.total_amount)}</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: quitado
                        ? '#10b981'
                        : 'linear-gradient(90deg, #f43f5e, #fb7185)',
                      boxShadow: quitado
                        ? '0 0 8px rgba(16,185,129,0.4)'
                        : '0 0 8px rgba(244,63,94,0.4)',
                    }}
                  />
                </div>

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
              <label className={labelCls}>Nome</label>
              <input type="text" value={form.name} onChange={field('name')} required placeholder="Ex: Financiamento do carro" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Valor total (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.total_amount} onChange={field('total_amount')} required placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valor pago (R$)</label>
                <input type="number" step="0.01" min="0" value={form.paid_amount} onChange={field('paid_amount')} placeholder="0,00" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nº de parcelas</label>
                <input type="number" min="1" value={form.installments} onChange={field('installments')} placeholder="Ex: 12" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vencimento</label>
                <input type="date" value={form.due_date} onChange={field('due_date')} className={inputCls} />
              </div>
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
