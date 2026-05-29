import { supabase } from './lib/supabase'

// ── Utilitários ───────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')

function nextMonthStr(month) {
  const [y, m] = month.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`
}

function flattenTx(tx) {
  return {
    ...tx,
    category_name:  tx.categories?.name  ?? null,
    category_color: tx.categories?.color ?? null,
    categories: undefined,
  }
}

function flattenInst(i) {
  return {
    ...i,
    bill_name:    i.fixed_bills?.name    ?? '(conta removida)',
    bill_due_day: i.fixed_bills?.due_day ?? null,
    fixed_bills: undefined,
  }
}

// Garante que existem instâncias do mês atual para cada conta fixa ativa
async function ensureMonthInstances(month) {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()

  const [{ data: bills }, { data: existing }] = await Promise.all([
    supabase.from('fixed_bills').select('*').eq('active', true),
    supabase.from('bill_instances').select('bill_id').eq('reference_month', month),
  ])

  const existingIds = new Set((existing || []).map(i => i.bill_id))
  const toInsert = (bills || [])
    .filter(b => !existingIds.has(b.id))
    .map(b => ({
      bill_id: b.id,
      reference_month: month,
      amount: b.amount,
      due_date: `${month}-${pad(Math.min(b.due_day, lastDay))}`,
      paid: false,
    }))

  if (toInsert.length > 0) {
    await supabase.from('bill_instances').insert(toInsert)
  }
}

// ── API pública ───────────────────────────────────────────────────────────────
export const api = {

  // Dashboard — agrega transações no cliente (simples e sem RPC)
  getDashboard: async (month) => {
    const { data: txs = [] } = await supabase
      .from('transactions')
      .select('amount, type, category_id, categories(name, color)')
      .gte('date', `${month}-01`)
      .lt('date', `${nextMonthStr(month)}-01`)

    const income   = txs.filter(t => t.type === 'income') .reduce((s, t) => s + Number(t.amount), 0)
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

    const catMap = {}
    txs.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.categories
      if (!cat) return
      catMap[t.category_id] ??= { name: cat.name, color: cat.color, total: 0 }
      catMap[t.category_id].total += Number(t.amount)
    })

    return {
      income,
      expenses,
      balance: income - expenses,
      byCategory: Object.values(catMap).sort((a, b) => b.total - a.total),
    }
  },

  // Transações
  getTransactions: async (month) => {
    const { data = [] } = await supabase
      .from('transactions')
      .select('*, categories(name, color)')
      .gte('date', `${month}-01`)
      .lt('date', `${nextMonthStr(month)}-01`)
      .order('date', { ascending: false })
      .order('id',   { ascending: false })
    return data.map(flattenTx)
  },

  createTransaction: async (d) => {
    const { data: row } = await supabase
      .from('transactions')
      .insert({ date: d.date, amount: d.amount, type: d.type, category_id: d.category_id || null, description: d.description || null })
      .select('*, categories(name, color)')
      .single()
    return flattenTx(row)
  },

  deleteTransaction: async (id) => {
    await supabase.from('transactions').delete().eq('id', id)
    return { success: true }
  },

  // Categorias
  getCategories: async () => {
    const { data = [] } = await supabase.from('categories').select('*').order('name')
    return data
  },

  // Metas
  getGoals: async () => {
    const { data = [] } = await supabase.from('goals').select('*').order('deadline', { nullsFirst: false })
    return data
  },

  createGoal: async (d) => {
    const { data: row } = await supabase.from('goals').insert(d).select().single()
    return row
  },

  updateGoal: async (id, d) => {
    const { data: row } = await supabase.from('goals').update(d).eq('id', id).select().single()
    return row
  },

  deleteGoal: async (id) => {
    await supabase.from('goals').delete().eq('id', id)
    return { success: true }
  },

  // Dívidas
  getDebts: async () => {
    const { data = [] } = await supabase.from('debts').select('*').order('due_date', { nullsFirst: false })
    return data
  },

  createDebt: async (d) => {
    const { data: row } = await supabase.from('debts').insert(d).select().single()
    return row
  },

  updateDebt: async (id, d) => {
    const { data: row } = await supabase.from('debts').update(d).eq('id', id).select().single()
    return row
  },

  deleteDebt: async (id) => {
    await supabase.from('debts').delete().eq('id', id)
    return { success: true }
  },

  // Contas Fixas — templates
  getFixedBills: async () => {
    const { data = [] } = await supabase.from('fixed_bills').select('*').order('due_day')
    return data
  },

  createFixedBill: async (d) => {
    const { data: bill } = await supabase
      .from('fixed_bills').insert({ ...d, active: true }).select().single()

    // Cria instância para o mês atual imediatamente
    const month = new Date().toISOString().slice(0, 7)
    const [y, m] = month.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    await supabase.from('bill_instances').insert({
      bill_id: bill.id,
      reference_month: month,
      amount: bill.amount,
      due_date: `${month}-${pad(Math.min(bill.due_day, lastDay))}`,
      paid: false,
    })
    return bill
  },

  updateFixedBill: async (id, d) => {
    const { data: row } = await supabase.from('fixed_bills').update(d).eq('id', id).select().single()
    return row
  },

  deleteFixedBill: async (id) => {
    await supabase.from('fixed_bills').delete().eq('id', id) // ON DELETE CASCADE apaga instâncias
    return { success: true }
  },

  // Contas Fixas — instâncias mensais
  getBillInstances: async () => {
    const month = new Date().toISOString().slice(0, 7)
    await ensureMonthInstances(month)

    // Mês atual (pagas ou não) + qualquer mês anterior não pago
    const [{ data: current = [] }, { data: overdue = [] }] = await Promise.all([
      supabase
        .from('bill_instances')
        .select('*, fixed_bills(name, due_day)')
        .eq('reference_month', month)
        .order('due_date'),
      supabase
        .from('bill_instances')
        .select('*, fixed_bills(name, due_day)')
        .lt('reference_month', month)
        .eq('paid', false)
        .order('due_date'),
    ])

    return [...overdue, ...current].map(flattenInst)
  },

  payInstance: async (id, body = {}) => {
    const { data: inst } = await supabase.from('bill_instances').select('amount').eq('id', id).single()
    const { data: row } = await supabase
      .from('bill_instances')
      .update({ paid: true, paid_at: new Date().toISOString().slice(0, 10), paid_amount: body.paid_amount ?? inst.amount })
      .eq('id', id)
      .select('*, fixed_bills(name, due_day)')
      .single()
    return flattenInst(row)
  },

  unpayInstance: async (id) => {
    const { data: row } = await supabase
      .from('bill_instances')
      .update({ paid: false, paid_at: null, paid_amount: null })
      .eq('id', id)
      .select('*, fixed_bills(name, due_day)')
      .single()
    return flattenInst(row)
  },
}
