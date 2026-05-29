import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckCircle2, Circle, AlertTriangle, Pencil, Trash2, Settings, X, RotateCcw } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
const curMonth = () => new Date().toISOString().slice(0, 7)
const monthLabel = (m) => new Date(m + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

const EMPTY_BILL = { name: '', amount: '', due_day: '' }

export default function FixedBills() {
  const [instances,    setInstances]    = useState([])
  const [fixedBills,   setFixedBills]   = useState([])
  const [showManage,   setShowManage]   = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [editingBill,  setEditingBill]  = useState(null)
  const [form,         setForm]         = useState(EMPTY_BILL)
  const [saving,       setSaving]       = useState(false)
  const [paying,       setPaying]       = useState(null) // id de instância sendo processada

  const month = curMonth()

  const load = useCallback(async () => {
    const [inst, bills] = await Promise.all([api.getBillInstances(), api.getFixedBills()])
    setInstances(inst)
    setFixedBills(bills)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Separar instâncias ──────────────────────────────────────────────────────
  const overdue  = instances.filter(i => i.reference_month !== month && !i.paid)
  const current  = instances.filter(i => i.reference_month === month)
  const paidNow  = current.filter(i =>  i.paid)
  const pendNow  = current.filter(i => !i.paid)

  const totalCurrent = current.reduce((s, i) => s + i.amount, 0)
  const totalPaid    = paidNow.reduce((s, i)  => s + (i.paid_amount ?? i.amount), 0)
  const totalPend    = pendNow.reduce((s, i)  => s + i.amount, 0) + overdue.reduce((s, i) => s + i.amount, 0)

  // ── Pagar / desfazer ────────────────────────────────────────────────────────
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

  // ── Gerenciar templates ─────────────────────────────────────────────────────
  const openAdd = () => { setEditingBill(null); setForm(EMPTY_BILL); setShowForm(true) }
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
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Contas Fixas</h1>
          <p className="text-gray-400 text-sm mt-0.5 capitalize">{monthLabel(month)}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManage(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Settings size={15} /> Gerenciar contas
          </button>
          <button
            onClick={() => { setShowManage(false); openAdd() }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nova Conta Fixa
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-gray-500">Total do mês</p>
          <p className="text-lg font-bold text-gray-800 mt-0.5">{fmt(totalCurrent)}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-emerald-600">Pago</p>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">{fmt(totalPaid)}</p>
        </div>
        <div className={`${totalPend > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'} border rounded-xl px-4 py-3`}>
          <p className={`text-xs font-medium ${totalPend > 0 ? 'text-red-600' : 'text-gray-500'}`}>Pendente</p>
          <p className={`text-lg font-bold mt-0.5 ${totalPend > 0 ? 'text-red-700' : 'text-gray-800'}`}>{fmt(totalPend)}</p>
        </div>
      </div>

      {instances.length === 0 && (
        <div className="text-center py-20 text-gray-300">
          <p className="text-sm">Nenhuma conta cadastrada ainda</p>
          <p className="text-xs mt-1">Clique em "Nova Conta Fixa" para começar</p>
        </div>
      )}

      {/* Atrasadas */}
      {overdue.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-500" />
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide">
              Atrasadas ({overdue.length})
            </h2>
          </div>
          <div className="space-y-2">
            {overdue.map(inst => (
              <BillRow
                key={inst.id}
                inst={inst}
                overdue
                loading={paying === inst.id}
                onPay={() => handlePay(inst.id)}
                onUnpay={() => handleUnpay(inst.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mês atual */}
      {current.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 capitalize">
            {monthLabel(month)}
          </h2>

          {/* Pendentes primeiro */}
          {pendNow.length > 0 && (
            <div className="space-y-2 mb-3">
              {pendNow.map(inst => (
                <BillRow
                  key={inst.id}
                  inst={inst}
                  loading={paying === inst.id}
                  onPay={() => handlePay(inst.id)}
                  onUnpay={() => handleUnpay(inst.id)}
                />
              ))}
            </div>
          )}

          {/* Pagas */}
          {paidNow.length > 0 && (
            <div className="space-y-2">
              {paidNow.map(inst => (
                <BillRow
                  key={inst.id}
                  inst={inst}
                  loading={paying === inst.id}
                  onPay={() => handlePay(inst.id)}
                  onUnpay={() => handleUnpay(inst.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal: gerenciar templates */}
      {showManage && (
        <Modal title="Gerenciar Contas Fixas" onClose={() => setShowManage(false)}>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {fixedBills.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma conta cadastrada</p>
            )}
            {fixedBills.map(bill => (
              <div key={bill.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{bill.name}</p>
                  <p className="text-xs text-gray-400">Vence dia {bill.due_day} · {fmt(bill.amount)}</p>
                </div>
                <button onClick={() => { openEdit(bill); setShowManage(false) }}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors shrink-0">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDeleteBill(bill.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setShowManage(false); openAdd() }}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nova Conta Fixa
          </button>
        </Modal>
      )}

      {/* Modal: criar / editar template */}
      {showForm && (
        <Modal title={editingBill ? 'Editar Conta Fixa' : 'Nova Conta Fixa'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmitBill} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome da conta</label>
              <input
                type="text" value={form.name} onChange={field('name')} required
                placeholder="Ex: Aluguel, Internet, Energia..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                <input
                  type="number" step="0.01" min="0.01" value={form.amount} onChange={field('amount')} required
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vence todo dia</label>
                <input
                  type="number" min="1" max="31" value={form.due_day} onChange={field('due_day')} required
                  placeholder="Ex: 10"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            {!editingBill && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                A conta será adicionada automaticamente todo mês. Se não for marcada como paga, continuará aparecendo no mês seguinte.
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ── Componente de linha de conta ───────────────────────────────────────────────
function BillRow({ inst, overdue, loading, onPay, onUnpay }) {
  const isPaid = inst.paid
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'
  const refLabel = new Date(inst.reference_month + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-colors ${
      isPaid
        ? 'bg-white border-gray-100'
        : overdue
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200'
    }`}>
      {/* Ícone de status */}
      <div className="shrink-0">
        {isPaid
          ? <CheckCircle2 size={20} className="text-emerald-500" />
          : overdue
            ? <AlertTriangle size={20} className="text-red-500" />
            : <Circle size={20} className="text-gray-300" />
        }
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${isPaid ? 'text-gray-500' : 'text-gray-900'}`}>
            {inst.bill_name}
          </p>
          {overdue && (
            <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full shrink-0 capitalize">
              {refLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {isPaid
            ? `Pago em ${fmtDate(inst.paid_at)}${inst.paid_amount !== inst.amount ? ` · ${fmt(inst.paid_amount)}` : ''}`
            : `Vence em ${fmtDate(inst.due_date)}`
          }
        </p>
      </div>

      {/* Valor */}
      <p className={`text-sm font-semibold shrink-0 ${isPaid ? 'text-gray-400 line-through' : overdue ? 'text-red-700' : 'text-gray-800'}`}>
        {fmt(inst.amount)}
      </p>

      {/* Ação */}
      <div className="shrink-0">
        {isPaid ? (
          <button
            onClick={onUnpay}
            disabled={loading}
            title="Desfazer pagamento"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <RotateCcw size={13} /> Desfazer
          </button>
        ) : (
          <button
            onClick={onPay}
            disabled={loading}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
              overdue
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle2 size={13} />
            {loading ? '...' : 'Pagar'}
          </button>
        )}
      </div>
    </div>
  )
}
