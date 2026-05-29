import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Target, CheckCircle2 } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

const EMPTY = { name: '', target_amount: '', current_amount: '', deadline: '' }

export default function Goals() {
  const [goals,      setGoals]      = useState([])
  const [showModal,  setShowModal]  = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => { api.getGoals().then(setGoals) }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = (g) => {
    setEditing(g)
    setForm({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, deadline: g.deadline || '' })
    setShowModal(true)
  }

  const field = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        name:           form.name,
        target_amount:  parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount) || 0,
        deadline:       form.deadline || null,
      }
      if (editing) {
        const updated = await api.updateGoal(editing.id, data)
        setGoals(p => p.map(g => g.id === editing.id ? updated : g))
      } else {
        const created = await api.createGoal(data)
        setGoals(p => [...p, created])
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('Excluir esta meta?')) return
    await api.deleteGoal(id)
    setGoals(p => p.filter(g => g.id !== id))
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Metas</h1>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus size={15} /> Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <Target size={48} className="mb-3" />
          <p className="text-sm">Nenhuma meta cadastrada ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {goals.map(goal => {
            const progress  = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
            const done      = progress >= 100
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0)
            return (
              <div key={goal.id} className={`bg-white rounded-2xl p-6 shadow-sm border transition-colors ${done ? 'border-emerald-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {done && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                    <h3 className="font-semibold text-gray-900 leading-snug">{goal.name}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(goal.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {goal.deadline && (
                  <p className="text-xs text-gray-400 mb-4">Prazo: {fmtDate(goal.deadline)}</p>
                )}

                <div className="mt-3 mb-2">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-800">{fmt(goal.current_amount)}</span>
                    <span className="text-gray-400">{fmt(goal.target_amount)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className={`text-sm font-semibold ${done ? 'text-emerald-600' : 'text-indigo-600'}`}>
                    {progress.toFixed(0)}% concluído
                  </span>
                  {done ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2.5 py-1 rounded-full">
                      Meta atingida!
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">faltam {fmt(remaining)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Editar Meta' : 'Nova Meta'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome da meta</label>
              <input type="text" value={form.name} onChange={field('name')} required placeholder="Ex: Fundo de emergência"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor da meta (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.target_amount} onChange={field('target_amount')} required placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor atual (R$)</label>
                <input type="number" step="0.01" min="0" value={form.current_amount} onChange={field('current_amount')} placeholder="0,00"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prazo</label>
              <input type="date" value={form.deadline} onChange={field('deadline')}
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
