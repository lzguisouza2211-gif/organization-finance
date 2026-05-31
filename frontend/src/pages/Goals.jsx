import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Target, CheckCircle2, PiggyBank } from 'lucide-react'
import { api } from '../api'
import Modal from '../components/Modal'
import ProgressBar from '../components/ProgressBar'
import AnimatedNumber from '../components/AnimatedNumber'
import { SkeletonCard } from '../components/Skeleton'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const EMPTY = { name: '', target_amount: '', current_amount: '', deadline: '' }

const inputCls = 'w-full rounded-xl px-4 py-3 text-[15px] text-white placeholder-[var(--text-dim)] focus:outline-none transition-all'
const labelCls = 'block text-[12px] font-semibold mb-1.5'

function daysLeft(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Goals({ refreshKey }) {
  const [goals,     setGoals]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getGoals().then(setGoals).finally(() => setLoading(false))
  }, [refreshKey])

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
    <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-extrabold text-white">Metas</h1>
        <button
          onClick={openAdd}
          className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5 btn-press ripple-wrapper"
          style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
        >
          + Nova
        </button>
      </div>

      {/* Hero card */}
      {!loading && goals.length > 0 && (
        <div
          className="rounded-[28px] p-6 mb-5 relative overflow-hidden stagger-item"
          style={{
            background: 'linear-gradient(140deg, var(--grad-from), var(--grad-to))',
            boxShadow: '0 16px 48px var(--grad-glow)',
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white opacity-[0.07] pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white opacity-[0.04] pointer-events-none" />
          <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wider mb-1 relative">Total guardado</p>
          <AnimatedNumber
            value={totalSaved}
            format={fmt}
            className="text-[32px] font-extrabold text-white tabular-nums leading-none mb-3 relative block"
          />
          <div className="relative">
            <div className="flex justify-between text-[11px] text-white/60 mb-2">
              <span>Meta total: {fmt(totalTarget)}</span>
              <span className="font-bold">{Math.round(heroProgress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${heroProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="sm:grid sm:grid-cols-2 sm:gap-4 space-y-3 sm:space-y-0">
          <SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Empty state */}
      {!loading && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-dim)' }}>
          <Target size={48} className="mb-3 opacity-40" />
          <p className="text-sm">Nenhuma meta cadastrada ainda</p>
        </div>
      )}

      {/* Goals grid */}
      {!loading && goals.length > 0 && (
        <div className="sm:grid sm:grid-cols-2 sm:gap-4 space-y-3 sm:space-y-0">
          {goals.map((goal, i) => {
            const progress  = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
            const done      = progress >= 100
            const remaining = Math.max(goal.target_amount - goal.current_amount, 0)
            const days      = daysLeft(goal.deadline)
            return (
              <div
                key={goal.id}
                className="rounded-[22px] p-5 transition-all stagger-item"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: done ? 'rgba(16,185,129,0.15)' : 'var(--surface-2)' }}
                    >
                      {done
                        ? <CheckCircle2 size={18} className="text-emerald-400" />
                        : <PiggyBank size={18} style={{ color: 'var(--text-dim)' }} />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white leading-tight truncate">{goal.name}</p>
                      {goal.deadline && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          {days !== null && days > 0
                            ? `${days} dias restantes`
                            : days === 0
                              ? 'Vence hoje!'
                              : `Vencido há ${Math.abs(days)} dias`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(goal)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <Pencil size={13} style={{ color: 'var(--text-dim)' }} />
                    </button>
                    <button onClick={() => remove(goal.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <Trash2 size={13} className="text-rose-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-bold text-white tabular-nums">{fmt(goal.current_amount)}</span>
                  <span className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--text-dim)' }}>{Math.round(progress)}%</span>
                  <span className="text-[13px] tabular-nums" style={{ color: 'var(--text-dim)' }}>{fmt(goal.target_amount)}</span>
                </div>

                <ProgressBar value={progress} color={done ? 'success' : 'gradient'} className="mb-2" />

                <p className={`text-[11px] font-semibold ${done ? 'text-emerald-400' : ''}`}
                  style={!done ? { color: 'var(--text-dim)' } : {}}>
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
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Nome da meta</label>
              <input type="text" value={form.name} onChange={field('name')} required
                placeholder="Ex: Fundo de emergência"
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Meta (R$)</label>
                <input type="number" step="0.01" min="0.01" value={form.target_amount} onChange={field('target_amount')} required
                  placeholder="0,00"
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Atual (R$)</label>
                <input type="number" step="0.01" min="0" value={form.current_amount} onChange={field('current_amount')}
                  placeholder="0,00"
                  className={inputCls}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                />
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-dim)' }}>Prazo</label>
              <input type="date" value={form.deadline} onChange={field('deadline')}
                className={inputCls}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
              />
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
