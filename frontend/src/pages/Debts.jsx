import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CreditCard, CheckCircle2 } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

const EMPTY = { name: '', total_amount: '', paid_amount: '', installments: '', due_date: '' }

export default function Debts() {
  const [debts,     setDebts]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { api.getDebts().then(setDebts) }, [])

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

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-5 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dívidas</h1>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={15} /> Nova Dívida
        </button>
      </div>

      {/* Summary */}
      {debts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-6">
          <div className="bg-red-50 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-red-600">Total em dívidas</p>
            <p className="text-lg font-bold text-red-700 mt-0.5">{fmt(totalDebt)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-emerald-600">Total pago</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{fmt(totalPaid)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-orange-600">Saldo devedor</p>
            <p className="text-lg font-bold text-orange-700 mt-0.5">{fmt(totalRemains)}</p>
          </div>
        </div>
      )}

      {debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <CreditCard size={48} className="mb-3" />
          <p className="text-sm">Nenhuma dívida cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {debts.map(debt => {
            const progress  = Math.min((debt.paid_amount / debt.total_amount) * 100, 100)
            const quitado   = progress >= 100
            const remaining = Math.max(debt.total_amount - debt.paid_amount, 0)
            return (
              <div key={debt.id} className={`bg-white rounded-2xl p-6 shadow-sm border ${quitado ? 'border-emerald-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {quitado && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                    <h3 className="font-semibold text-gray-900 leading-snug">{debt.name}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(debt)} className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(debt.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  {debt.installments && (
                    <span className="text-xs text-gray-400">{debt.installments}× parcelas</span>
                  )}
                  {debt.due_date && (
                    <span className="text-xs text-gray-400">Vencimento: {fmtDate(debt.due_date)}</span>
                  )}
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Pago: <strong className="text-gray-800">{fmt(debt.paid_amount)}</strong></span>
                    <span className="text-gray-400">Total: {fmt(debt.total_amount)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${quitado ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className={`text-sm font-semibold ${quitado ? 'text-emerald-600' : 'text-red-600'}`}>
                    {progress.toFixed(0)}% pago
                  </span>
                  {quitado ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2.5 py-1 rounded-full">
                      Quitada!
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">restam {fmt(remaining)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Editar Dívida' : 'Nova Dívida'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
              <input type="text" value={form.name} onChange={field('name')} required placeholder="Ex: Financiamento do carro"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor total (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.total_amount} onChange={field('total_amount')} required placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor pago (R$)</label>
                <input type="number" step="0.01" min="0" value={form.paid_amount} onChange={field('paid_amount')} placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nº de parcelas</label>
                <input type="number" min="1" value={form.installments} onChange={field('installments')} placeholder="Ex: 12"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vencimento</label>
                <input type="date" value={form.due_date} onChange={field('due_date')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowModal(false)}
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
