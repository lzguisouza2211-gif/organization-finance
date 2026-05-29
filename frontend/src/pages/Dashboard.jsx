import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { api } from '../api'

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const currentMonth = () => new Date().toISOString().slice(0, 7)

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth)
  const [data, setData]   = useState({ income: 0, expenses: 0, balance: 0, byCategory: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getDashboard(month)
      .then(setData)
      .catch(() => setError('Não foi possível conectar ao backend.'))
      .finally(() => setLoading(false))
  }, [month])

  const monthLabel = new Date(month + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5 capitalize">{monthLabel}</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="w-full sm:w-auto border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
        <Card title="Receitas"  value={data.income}   icon={<TrendingUp size={18}  />} scheme="green"  />
        <Card title="Gastos"    value={data.expenses} icon={<TrendingDown size={18} />} scheme="red"    />
        <Card title="Saldo"     value={data.balance}  icon={<Wallet size={18}       />} scheme={data.balance >= 0 ? 'indigo' : 'orange'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-5">
        {/* Pie chart */}
        <div className="md:col-span-3 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Gastos por Categoria</h2>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-gray-300 text-sm">Carregando...</div>
          ) : data.byCategory.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-300 text-sm">
              Nenhum gasto registrado neste mês
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.byCategory}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={48}
                  paddingAngle={2}
                >
                  {data.byCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0/.1)' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 12, color: '#4b5563' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="md:col-span-2 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Detalhamento</h2>
          {data.byCategory.length === 0 ? (
            <p className="text-gray-300 text-sm">Nenhum dado</p>
          ) : (
            <div className="space-y-3">
              {data.byCategory.map((cat, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-gray-600 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-semibold text-gray-800">{fmt(cat.total)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full ml-4">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: cat.color,
                        width: data.expenses > 0 ? `${(cat.total / data.expenses) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.expenses > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total gastos</span>
                <span className="font-semibold text-red-600">{fmt(data.expenses)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">Total receitas</span>
                <span className="font-semibold text-emerald-600">{fmt(data.income)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const schemes = {
  green:  { border: 'border-emerald-100', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', valueText: 'text-emerald-700' },
  red:    { border: 'border-red-100',     iconBg: 'bg-red-50',     iconText: 'text-red-600',     valueText: 'text-red-700'     },
  indigo: { border: 'border-indigo-100',  iconBg: 'bg-indigo-50',  iconText: 'text-indigo-600',  valueText: 'text-gray-900'    },
  orange: { border: 'border-orange-100',  iconBg: 'bg-orange-50',  iconText: 'text-orange-600',  valueText: 'text-orange-700'  },
}

function Card({ title, value, icon, scheme }) {
  const s = schemes[scheme] || schemes.indigo
  return (
    <div className={`bg-white rounded-2xl p-4 md:p-5 shadow-sm border ${s.border}`}>
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
        <div className={`p-2 rounded-xl ${s.iconBg} ${s.iconText}`}>{icon}</div>
      </div>
      <p className={`text-xl md:text-2xl font-bold ${s.valueText}`}>{fmt(value)}</p>
    </div>
  )
}
