import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Target, CheckCircle2, PiggyBank } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

const EMPTY = { name: '', target_amount: '', current_amount: '', deadline: '' }

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-[var(--grad-to)]'
const labelCls = 'block text-[12px] font-semibold text-zinc-400 mb-1.5'

export default function Goals({ refreshKey }) {
  const [goals,     setGoals]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { api.getGoals().then(setGoals) }, [refreshKey])

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

  const totalSaved  = goals.reduce((s, g) => s + g.current_amount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0)
  const heroProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-extrabold text-white">Metas</h1>
        <button
          onClick={openAdd}
          className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
        >
          + Nova
        </button>
      </div>

      {/* Hero card */}
      {goals.length > 0 && (
        <div
          className="rounded-[28px] p-6 mb-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(140deg, var(--grad-from), var(--grad-to))',
            boxShadow: '0 16px 48px var(--grad-glow)',
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-[0.08]" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white opacity-[0.05]" />
          <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wide mb-1 relative">Total guardado</p>
          <p className="text-[32px] font-extrabold text-white tabular-nums leading-none mb-3 relative">{fmt(totalSaved)}</p>
          <div className="relative">
            <div className="flex justify-between text-[11px] text-white/60 mb-1.5">
              <span>Meta total: {fmt(totalTarget)}</span>
              <span>{Math.round(heroProgress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${heroProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <Target size={48} className="mb-3" />
          <p className="text-sm">Nenhuma meta cadastrada ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const progress  = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
            const done      = progress >= 100
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0)
            return (
              <div
                key={goal.id}
                className={`rounded-[22px] bg-zinc-900/70 border p-5 ${done ? 'border-emerald-500/30' : 'border-white/8'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500/20' : 'bg-white/8'}`}>
                      {done
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <PiggyBank size={18} className="text-zinc-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white leading-tight truncate">{goal.name}</p>
                      {goal.deadline && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">Prazo: {fmtDate(goal.deadline)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(goal)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 active:bg-white/10">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => remove(goal.id)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 active:bg-rose-500/20">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-bold text-white tabular-nums">{fmt(goal.current_amount)}</span>
                  <span className="text-[12px] font-bold text-zinc-500 tabular-nums">{Math.round(progress)}%</span>
                  <span className="text-[13px] text-zinc-500 tabular-nums">{fmt(goal.target_amount)}</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-white/8 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: done
                        ? '#10b981'
                        : 'linear-gradient(90deg, var(--grad-from), var(--grad-to))',
                      boxShadow: done ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px var(--grad-glow)',
                    }}
                  />
                </div>

                <p className={`text-[11px] font-semibold ${done ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {done ? 'Meta atingida!' : `faltam ${fmt(remaining)}`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Editar Meta' : 'Nova Meta'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className={labelCls}>Nome da meta</label>
              <input type="text" value={form.name} onChange={field('name')} required placeholder="Ex: Fundo de emergência" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Meta (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.target_amount} onChange={field('target_amount')} required placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Atual (R$)</label>
                <input type="number" step="0.01" min="0" value={form.current_amount} onChange={field('current_amount')} placeholder="0,00" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Prazo</label>
              <input type="date" value={form.deadline} onChange={field('deadline')} className={inputCls} />
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
