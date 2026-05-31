import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckCircle2, Circle, AlertTriangle, Pencil, Trash2, Settings, RotateCcw } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import Badge from '../components/Badge'
import { SkeletonList } from '../components/Skeleton'

const fmt      = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const curMonth = () => new Date().toISOString().slice(0, 7)
const monthLabel = (m) => new Date(m + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

const EMPTY_BILL = { name: '', amount: '', due_day: '' }

const inputCls = 'w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder-[var(--text-dim)] focus:outline-none transition-all'
const labelCls = 'block text-[12px] font-semibold mb-1.5'

export default function FixedBills({ refreshKey }) {
  const [instances,   setInstances]   = useState([])
  const [fixedBills,  setFixedBills]  = useState([])
  const [showManage,  setShowManage]  = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [form,        setForm]        = useState(EMPTY_BILL)
  const [saving,      setSaving]      = useState(false)
  const [paying,      setPaying]      = useState(null)
  const [loading,     setLoading]     = useState(true)

  const month = curMonth()

  const load = useCallback(async () => {
    const [inst, bills] = await Promise.all([api.getBillInstances(), api.getFixedBills()])
    setInstances(inst)
    setFixedBills(bills)
  }, [])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load, refreshKey])

  const overdue  = instances.filter(i => i.reference_month !== month && !i.paid)
  const current  = instances.filter(i => i.reference_month === month)
  const paidNow  = current.filter(i =>  i.paid)
  const pendNow  = current.filter(i => !i.paid)

  const totalCurrent  = current.reduce((s, i) => s + i.amount, 0)
  const totalPaid     = paidNow.reduce((s, i) => s + (i.paid_amount ?? i.amount), 0)
  const totalPend     = pendNow.reduce((s, i) => s + i.amount, 0) + overdue.reduce((s, i) => s + i.amount, 0)
  const heroProgress  = totalCurrent > 0 ? Math.min((totalPaid / totalCurrent) * 100, 100) : 0

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
    <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-2">
        <div>
          <h1 className="text-[22px] font-extrabold text-white whitespace-nowrap">Contas Fixas</h1>
          <p className="text-[11px] capitalize" style={{ color: 'var(--text-dim)' }}>{monthLabel(month)}</p>
        </div>
        <button
          onClick={() => setShowManage(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center btn-press"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Settings size={17} style={{ color: 'var(--text-dim)' }} />
        </button>
      </div>

      {/* Hero progress card */}
      {!loading && instances.length > 0 && (
        <div
          className="rounded-[28px] p-5 mb-5 relative overflow-hidden stagger-item"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.06] pointer-events-none"
            style={{ background: 'var(--primary)' }} />
          <p className="text-[12px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-dim)' }}>
            Pago neste mês
          </p>
          <div className="flex items-end gap-3 mb-4">
            <p className="text-[28px] font-extrabold text-white tabular-nums leading-none">{fmt(totalPaid)}</p>
            <p className="text-[13px] mb-0.5" style={{ color: 'var(--text-dim)' }}>de {fmt(totalCurrent)}</p>
          </div>
          <ProgressBar value={heroProgress} height="h-2.5" className="mb-4" />
          <div className="flex gap-3 flex-wrap">
            <Badge variant="success">Pago {fmt(totalPaid)}</Badge>
            {totalPend > 0 ? (
              <Badge variant="danger">Pendente {fmt(totalPend)}</Badge>
            ) : (
              <Badge variant="neutral">Tudo pago!</Badge>
            )}
          </div>
        </div>
      )}

      {!loading && instances.length === 0 && (
        <div className="text-center py-20" style={{ color: 'var(--text-dim)' }}>
          <p className="text-sm mb-4">Nenhuma conta cadastrada ainda</p>
          <button
            onClick={openAdd}
            className="h-9 px-5 rounded-full text-[13px] font-bold text-white inline-flex items-center gap-1.5 btn-press"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
          >
            <Plus size={15} /> Nova Conta Fixa
          </button>
        </div>
      )}

      {loading && <SkeletonList rows={4} />}

      {/* Overdue */}
      {!loading && overdue.length > 0 && (
        <section className="mb-5 stagger-item">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-rose-400" />
            <h2 className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">
              Atrasadas ({overdue.length})
            </h2>
          </div>
          <div className="space-y-2">
            {overdue.map(inst => (
              <BillRow key={inst.id} inst={inst} overdue loading={paying === inst.id}
                onPay={() => handlePay(inst.id)} onUnpay={() => handleUnpay(inst.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Current month */}
      {!loading && current.length > 0 && (
        <section>
          {pendNow.length > 0 && (
            <div className="mb-4 stagger-item" style={{ animationDelay: '50ms' }}>
              <h2 className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-dim)' }}>A pagar</h2>
              <div className="space-y-2">
                {pendNow.map(inst => (
                  <BillRow key={inst.id} inst={inst} loading={paying === inst.id}
                    onPay={() => handlePay(inst.id)} onUnpay={() => handleUnpay(inst.id)} />
                ))}
              </div>
            </div>
          )}
          {paidNow.length > 0 && (
            <div className="stagger-item" style={{ animationDelay: '100ms' }}>
              <h2 className="text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-dim)' }}>Pagas</h2>
              <div className="space-y-2">
                {paidNow.map(inst => (
                  <BillRow key={inst.id} inst={inst} loading={paying === inst.id}
                    onPay={() => handlePay(inst.id)} onUnpay={() => handleUnpay(inst.id)} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Manage modal */}
      {showManage && (
        <Modal title="Gerenciar Contas Fixas" onClose={() => setShowManage(false)}>
          <div className="space-y-2 mt-2 max-h-72 overflow-y-auto no-scrollbar">
            {fixedBills.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>Nenhuma conta cadastrada</p>
            )}
            {fixedBills.map(bill => (
              <div key={bill.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">{bill.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Vence dia {bill.due_day} · {fmt(bill.amount)}</p>
                </div>
                <button onClick={() => { openEdit(bill); setShowManage(false) }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Pencil size={13} style={{ color: 'var(--text-dim)' }} />
                </button>
                <button onClick={() => handleDeleteBill(bill.id)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <Trash2 size={13} className="text-rose-400" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setShowManage(false); openAdd() }}
            className="mt-4 w-full py-3.5 rounded-2xl text-white font-bold text-[15px] btn-press ripple-wrapper"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 20px var(--grad-glow)' }}
          >
            Nova Conta Fixa
          </button>
        </Modal>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <Modal title={editingBill ? 'Editar Conta Fixa' : 'Nova Conta Fixa'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmitBill} className="space-y-4 mt-2">
            <div>
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Nome da conta</label>
              <input type="text" value={form.name} onChange={field('name')} required
                placeholder="Ex: Aluguel, Internet, Energia..."
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Valor (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={field('amount')} required
                  placeholder="0,00"
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Vence todo dia</label>
                <input type="number" min="1" max="31" value={form.due_day} onChange={field('due_day')} required
                  placeholder="Ex: 10"
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
            </div>
            {!editingBill && (
              <p className="text-[12px] rounded-2xl px-4 py-3" style={{ color: 'var(--text-dim)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                A conta será adicionada automaticamente todo mês.
              </p>
            )}
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

function BillRow({ inst, overdue, loading, onPay, onUnpay }) {
  const [justPaid, setJustPaid] = useState(false)
  const isPaid   = inst.paid
  const fmtD     = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
  const refLabel = new Date(inst.reference_month + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const handlePay = async () => {
    await onPay()
    setJustPaid(true)
    setTimeout(() => setJustPaid(false), 1500)
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-[18px] transition-all duration-300 ${
        isPaid ? 'opacity-60' : ''
      }`}
      style={{
        background: isPaid
          ? 'var(--surface)'
          : overdue
            ? 'rgba(239,68,68,0.06)'
            : 'var(--surface)',
        border: isPaid
          ? '1px solid var(--border)'
          : overdue
            ? '1px solid rgba(239,68,68,0.2)'
            : '1px solid var(--border)',
      }}
    >
      <div className="shrink-0">
        {isPaid
          ? <CheckCircle2 size={20} className="text-emerald-400" />
          : overdue
            ? <AlertTriangle size={20} className="text-rose-400" />
            : <Circle size={20} style={{ color: 'var(--border-2)' }} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className={`text-[14px] font-semibold truncate ${isPaid ? 'line-through' : 'text-white'}`}
            style={isPaid ? { color: 'var(--text-dim)' } : {}}>
            {inst.bill_name}
          </p>
          {overdue && (
            <Badge variant="danger" className="shrink-0 capitalize text-[9px]">{refLabel}</Badge>
          )}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {isPaid
            ? `Pago em ${fmtD(inst.paid_at)}${inst.paid_amount !== inst.amount ? ` · ${fmt(inst.paid_amount)}` : ''}`
            : `Vence em ${fmtD(inst.due_date)}`
          }
        </p>
      </div>

      <p className={`text-[14px] font-bold tabular-nums shrink-0 ${
        isPaid ? 'line-through' : overdue ? 'text-rose-400' : 'text-white'
      }`} style={isPaid ? { color: 'var(--text-dim)' } : {}}>
        {fmt(inst.amount)}
      </p>

      <div className="shrink-0">
        {isPaid ? (
          <button
            onClick={onUnpay}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-xl disabled:opacity-40 whitespace-nowrap transition-colors"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
          >
            <RotateCcw size={11} /> Desfazer
          </button>
        ) : (
          <button
            onClick={handlePay}
            disabled={loading}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl disabled:opacity-40 whitespace-nowrap transition-all ${
              justPaid ? 'scale-110' : 'scale-100'
            } ${overdue ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}
          >
            {loading
              ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              : <CheckCircle2 size={12} />
            }
            {loading ? '...' : 'Pagar'}
          </button>
        )}
      </div>
    </div>
  )
}
