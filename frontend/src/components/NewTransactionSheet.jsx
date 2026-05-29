import { useState, useEffect } from 'react'
import { api } from '../api'
import Sheet from './Modal'

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY = { date: today(), amount: '', type: 'expense', category_id: '', description: '' }

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--grad-to)]'
const labelCls = 'block text-[12px] font-semibold text-zinc-400 mb-1.5'

export default function NewTransactionSheet({ onClose, onSave }) {
  const [categories, setCategories] = useState([])
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => { api.getCategories().then(setCategories) }, [])

  const filtered = categories.filter(c => c.type === form.type || c.type === 'both')
  const field    = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const tx = await api.createTransaction({ ...form, amount: parseFloat(form.amount) })
      onSave(tx)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet title="Nova Transação" onClose={onClose}>
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
          <input
            type="number" step="0.01" min="0.01"
            value={form.amount} onChange={field('amount')} required placeholder="0,00"
            className={inputCls}
          />
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
          <input
            type="text" value={form.description} onChange={field('description')}
            placeholder="Ex: Supermercado"
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] disabled:opacity-50 active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
            boxShadow: '0 4px 20px var(--grad-glow)',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Transação'}
        </button>
      </form>
    </Sheet>
  )
}
