import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
const curMonth = () => new Date().toISOString().slice(0, 7)
const today    = () => new Date().toISOString().slice(0, 10)

const EMPTY = { date: today(), amount: '', type: 'expense', category_id: '', description: '' }

export default function Transactions() {
  const [month,        setMonth]        = useState(curMonth)
  const [transactions, setTransactions] = useState([])
  const [categories,   setCategories]   = useState([])
  const [showModal,    setShowModal]    = useState(false)
  const [form,         setForm]         = useState(EMPTY)
  const [saving,       setSaving]       = useState(false)

  useEffect(() => { api.getCategories().then(setCategories) }, [])
  useEffect(() => { api.getTransactions(month).then(setTransactions) }, [month])

  const filtered = categories.filter(c => c.type === form.type || c.type === 'both')
  const field = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

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

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lançamentos</h1>
        <div className="flex gap-2">
          <input
            type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="flex-1 sm:flex-none border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => { setForm(EMPTY); setShowModal(true) }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={15} /> <span className="hidden sm:inline">Nova Transação</span><span className="sm:hidden">Nova</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-6">
        <div className="bg-emerald-50 rounded-xl px-3 md:px-4 py-3">
          <p className="text-xs font-medium text-emerald-600">Receitas</p>
          <p className="text-base md:text-lg font-bold text-emerald-700 mt-0.5">{fmt(income)}</p>
        </div>
        <div className="bg-red-50 rounded-xl px-3 md:px-4 py-3">
          <p className="text-xs font-medium text-red-600">Gastos</p>
          <p className="text-base md:text-lg font-bold text-red-700 mt-0.5">{fmt(expenses)}</p>
        </div>
        <div className={`${income - expenses >= 0 ? 'bg-indigo-50' : 'bg-orange-50'} rounded-xl px-3 md:px-4 py-3`}>
          <p className={`text-xs font-medium ${income - expenses >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>Saldo</p>
          <p className={`text-base md:text-lg font-bold mt-0.5 ${income - expenses >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>{fmt(income - expenses)}</p>
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <Receipt size={36} className="mb-2" />
            <p className="text-sm">Nenhuma transação neste mês</p>
          </div>
        ) : transactions.map(tx => (
          <div key={tx.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {tx.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{tx.description || '—'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {tx.category_color && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.category_color }} />
                )}
                <p className="text-xs text-gray-400 truncate">{tx.category_name || '—'} · {fmtDate(tx.date)}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
              </p>
              <button onClick={() => remove(tx.id)} className="text-gray-300 hover:text-red-500 transition-colors mt-1">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Receipt size={40} className="mb-3" />
            <p className="text-sm">Nenhuma transação neste mês</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider last:w-10">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{fmtDate(tx.date)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-900 font-medium max-w-[180px] truncate">{tx.description || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.category_color || '#d1d5db' }} />
                      <span className="text-sm text-gray-600 truncate max-w-[120px]">{tx.category_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.type === 'income' ? <><ArrowUpCircle size={11} /> Receita</> : <><ArrowDownCircle size={11} /> Gasto</>}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '−'} {fmt(tx.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => remove(tx.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title="Nova Transação" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, category_id: '' }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="expense">Gasto</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                <input type="date" value={form.date} onChange={field('date')} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={field('amount')} required placeholder="0,00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select value={form.category_id} onChange={field('category_id')} required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Selecione...</option>
                {filtered.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
              <input type="text" value={form.description} onChange={field('description')} placeholder="Ex: Supermercado"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
