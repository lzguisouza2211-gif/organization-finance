import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckCircle2, Circle, AlertTriangle, Pencil, Trash2, Settings, RotateCcw } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt      = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate  = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
const curMonth = () => new Date().toISOString().slice(0, 7)
const monthLabel = (m) => new Date(m + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

const EMPTY_BILL = { name: '', amount: '', due_day: '' }

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--grad-to)]'
const labelCls = 'block text-[12px] font-semibold text-zinc-400 mb-1.5'

export default function FixedBills({ refreshKey }) {
  const [instances,   setInstances]   = useState([])
  const [fixedBills,  setFixedBills]  = useState([])
  const [showManage,  setShowManage]  = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [form,        setForm]        = useState(EMPTY_BILL)
  const [saving,      setSaving]      = useState(false)
  const [paying,      setPaying]      = useState(null)

  const month = curMonth()

  const load = useCallback(async () => {
    const [inst, bills] = await Promise.all([api.getBillInstances(), api.getFixedBills()])
    setInstances(inst)
    setFixedBills(bills)
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const overdue = instances.filter(i => i.reference_month !== month && !i.paid)
  const current = instances.filter(i => i.reference_month === month)
  const paidNow = current.filter(i =>  i.paid)
  const pendNow = current.filter(i => !i.paid)

  const totalCurrent = current.reduce((s, i) => s + i.amount, 0)
  const totalPaid    = paidNow.reduce((s, i)  => s + (i.paid_amount ?? i.amount), 0)
  const totalPend    = pendNow.reduce((s, i)  => s + i.amount, 0) + overdue.reduce((s, i) => s + i.amount, 0)
  const heroProgress = totalCurrent > 0 ? Math.min((totalPaid / totalCurrent) * 100, 100) : 0

  const handlePay = async (id) => {
    setPaying(id)
    try {
      const updated = await api.payInstance(id)
      setInstances(p => p.map(i => i.id === id ? updated : i))
    } finally {
      setPaying(null)
    }
  }

  const handleUnpay = async (id) => {
    setPaying(id)
    try {
      const updated = await api.unpayInstance(id)
      setInstances(p => p.map(i => i.id === id ? updated : i))
    } finally {
      setPaying(null)
    }
  }

  const openAdd  = () => { setEditingBill(null); setForm(EMPTY_BILL); setShowForm(true) }
  const openEdit = (b) => { setEditingBill(b); setForm({ name: b.name, amount: b.amount, due_day: b.due_day }); setShowForm(true) }

  const handleSubmitBill = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { name: form.name, amount: parseFloat(form.amount), due_day: parseInt(form.due_day) }
      if (editingBill) {
        const updated = await api.updateFixedBill(editingBill.id, data)
        setFixedBills(p => p.map(b => b.id === editingBill.id ? updated : b))
      } else {
        await api.createFixedBill(data)
        await load()
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBill = async (id) => {
    if (!confirm('Excluir esta conta fixa? Todo o histórico dela também será removido.')) return
    await api.deleteFixedBill(id)
    await load()
  }

  const field = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-white whitespace-nowrap">Contas Fixas</h1>
          <p className="text-[11px] text-zinc-500 capitalize">{monthLabel(month)}</p>
        </div>
        <button
          onClick={() => setShowManage(true)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 active:bg-white/10 shrink-0"
        >
          <Settings size={17} />
        </button>
      </div>

      {/* Hero progress card */}
      {instances.length > 0 && (
        <div className="rounded-[28px] bg-zinc-900/80 border border-white/8 p-5 mb-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-500 opacity-[0.06]" />
          <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Pago neste mês</p>
          <div className="flex items-end gap-3 mb-3">
            <p className="text-[28px] font-extrabold text-white tabular-nums leading-none">{fmt(totalPaid)}</p>
            <p className="text-[13px] text-zinc-500 mb-0.5">de {fmt(totalCurrent)}</p>
          </div>
          <div className="h-2 rounded-full bg-white/8 mb-3">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${heroProgress}%`,
                background: 'linear-gradient(90deg, var(--grad-from), var(--grad-to))',
                boxShadow: '0 0 8px var(--grad-glow)',
              }}
            />
          </div>
          <div className="flex gap-3">
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 rounded-full px-3 py-1 whitespace-nowrap">
              Pago {fmt(totalPaid)}
            </span>
            <span className={`text-[11px] font-bold rounded-full px-3 py-1 whitespace-nowrap ${totalPend > 0 ? 'text-rose-400 bg-rose-500/10' : 'text-zinc-400 bg-white/5'}`}>
              Pendente {fmt(totalPend)}
            </span>
          </div>
        </div>
      )}

      {instances.length === 0 && (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-sm">Nenhuma conta cadastrada ainda</p>
          <button
            onClick={openAdd}
            className="mt-4 h-9 px-5 rounded-full text-[13px] font-bold text-white inline-flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
          >
            <Plus size={15} /> Nova Conta Fixa
          </button>
        </div>
      )}

      {/* Overdue section */}
      {overdue.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-rose-400" />
            <h2 className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">
              Atrasadas ({overdue.length})
            </h2>
          </div>
          <div className="space-y-2">
            {overdue.map(inst => (
              <BillRow key={inst.id} inst={inst} overdue loading={paying === inst.id} onPay={() => handlePay(inst.id)} onUnpay={() => handleUnpay(inst.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Current month */}
      {current.length > 0 && (
        <section>
          {pendNow.length > 0 && (
            <>
              <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide mb-3">A pagar</h2>
              <div className="space-y-2 mb-4">
                {pendNow.map(inst => (
                  <BillRow key={inst.id} inst={inst} loading={paying === inst.id} onPay={() => handlePay(inst.id)} onUnpay={() => handleUnpay(inst.id)} />
                ))}
              </div>
            </>
          )}

          {paidNow.length > 0 && (
            <>
              <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide mb-3">Pagas</h2>
              <div className="space-y-2">
                {paidNow.map(inst => (
                  <BillRow key={inst.id} inst={inst} loading={paying === inst.id} onPay={() => handlePay(inst.id)} onUnpay={() => handleUnpay(inst.id)} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Sheet: manage templates */}
      {showManage && (
        <Modal title="Gerenciar Contas Fixas" onClose={() => setShowManage(false)}>
          <div className="space-y-2 mt-2 max-h-72 overflow-y-auto no-scrollbar">
            {fixedBills.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">Nenhuma conta cadastrada</p>
            )}
            {fixedBills.map(bill => (
              <div key={bill.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">{bill.name}</p>
                  <p className="text-[11px] text-zinc-500">Vence dia {bill.due_day} · {fmt(bill.amount)}</p>
                </div>
                <button onClick={() => { openEdit(bill); setShowManage(false) }} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 active:bg-white/10 shrink-0">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDeleteBill(bill.id)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 active:bg-rose-500/20 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setShowManage(false); openAdd() }}
            className="mt-4 w-full py-3.5 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 20px var(--grad-glow)' }}
          >
            Nova Conta Fixa
          </button>
        </Modal>
      )}

      {/* Sheet: create / edit template */}
      {showForm && (
        <Modal title={editingBill ? 'Editar Conta Fixa' : 'Nova Conta Fixa'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmitBill} className="space-y-4 mt-2">
            <div>
              <label className={labelCls}>Nome da conta</label>
              <input type="text" value={form.name} onChange={field('name')} required placeholder="Ex: Aluguel, Internet, Energia..." className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Valor (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={field('amount')} required placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vence todo dia</label>
                <input type="number" min="1" max="31" value={form.due_day} onChange={field('due_day')} required placeholder="Ex: 10" className={inputCls} />
              </div>
            </div>
            {!editingBill && (
              <p className="text-[12px] text-zinc-500 bg-white/5 rounded-2xl px-4 py-3">
                A conta será adicionada automaticamente todo mês. Se não for marcada como paga, continuará aparecendo no mês seguinte.
              </p>
            )}
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

function BillRow({ inst, overdue, loading, onPay, onUnpay }) {
  const isPaid   = inst.paid
  const fmt      = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const fmtDate  = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
  const refLabel = new Date(inst.reference_month + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 rounded-[18px] border ${
      isPaid
        ? 'bg-zinc-900/50 border-white/6'
        : overdue
          ? 'bg-rose-500/8 border-rose-500/20'
          : 'bg-zinc-900/60 border-white/8'
    }`}>
      {/* Status icon */}
      <div className="shrink-0">
        {isPaid
          ? <CheckCircle2 size={20} className="text-emerald-400" />
          : overdue
            ? <AlertTriangle size={20} className="text-rose-400" />
            : <Circle size={20} className="text-zinc-600" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className={`text-[14px] font-semibold truncate ${isPaid ? 'text-zinc-500' : 'text-white'}`}>
            {inst.bill_name}
          </p>
          {overdue && (
            <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full shrink-0 capitalize">
              {refLabel}
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          {isPaid
            ? `Pago em ${fmtDate(inst.paid_at)}${inst.paid_amount !== inst.amount ? ` · ${fmt(inst.paid_amount)}` : ''}`
            : `Vence em ${fmtDate(inst.due_date)}`
          }
        </p>
      </div>

      {/* Amount */}
      <p className={`text-[14px] font-bold tabular-nums shrink-0 ${isPaid ? 'text-zinc-600 line-through' : overdue ? 'text-rose-400' : 'text-white'}`}>
        {fmt(inst.amount)}
      </p>

      {/* Action */}
      <div className="shrink-0">
        {isPaid ? (
          <button
            onClick={onUnpay}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] text-zinc-500 bg-white/5 px-2.5 py-1.5 rounded-xl disabled:opacity-40 active:bg-white/10 whitespace-nowrap"
          >
            <RotateCcw size={12} /> Desfazer
          </button>
        ) : (
          <button
            onClick={onPay}
            disabled={loading}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl disabled:opacity-40 whitespace-nowrap ${
              overdue
                ? 'bg-rose-600 text-white active:bg-rose-700'
                : 'bg-emerald-600 text-white active:bg-emerald-700'
            }`}
          >
            <CheckCircle2 size={12} />
            {loading ? '...' : 'Pagar'}
          </button>
        )}
      </div>
    </div>
  )
}
