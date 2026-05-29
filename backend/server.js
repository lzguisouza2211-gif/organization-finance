const express = require('express');
const cors    = require('cors');
const { db, save, nextId } = require('./database');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── helpers ──────────────────────────────────────────────────────────────────
const withCat = (tx) => {
  const cat = db.categories.find(c => c.id === tx.category_id);
  return { ...tx, category_name: cat?.name ?? null, category_color: cat?.color ?? null };
};

// ── Dashboard ────────────────────────────────────────────────────────────────
app.get('/api/dashboard', (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const txs   = db.transactions.filter(t => t.date.startsWith(month));

  const income   = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const catTotals = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    const cat = db.categories.find(c => c.id === t.category_id);
    if (!cat) return;
    catTotals[cat.id] = catTotals[cat.id] || { name: cat.name, color: cat.color, total: 0 };
    catTotals[cat.id].total += t.amount;
  });
  const byCategory = Object.values(catTotals).sort((a, b) => b.total - a.total);

  res.json({ income, expenses, balance: income - expenses, byCategory });
});

// ── Transactions ─────────────────────────────────────────────────────────────
app.get('/api/transactions', (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const rows  = db.transactions
    .filter(t => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .map(withCat);
  res.json(rows);
});

app.post('/api/transactions', (req, res) => {
  const { date, amount, type, category_id, description } = req.body;
  const tx = { id: nextId('transactions'), date, amount, type, category_id: Number(category_id) || null, description: description || null };
  db.transactions.push(tx);
  save();
  res.json(withCat(tx));
});

app.delete('/api/transactions/:id', (req, res) => {
  const id = Number(req.params.id);
  db.transactions = db.transactions.filter(t => t.id !== id);
  save();
  res.json({ success: true });
});

// ── Categories ───────────────────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  res.json([...db.categories].sort((a, b) => a.name.localeCompare(b.name)));
});

// ── Goals ────────────────────────────────────────────────────────────────────
app.get('/api/goals', (req, res) => {
  res.json([...db.goals].sort((a, b) => (a.deadline || '').localeCompare(b.deadline || '')));
});

app.post('/api/goals', (req, res) => {
  const { name, target_amount, current_amount, deadline } = req.body;
  const goal = { id: nextId('goals'), name, target_amount, current_amount: current_amount || 0, deadline: deadline || null };
  db.goals.push(goal);
  save();
  res.json(goal);
});

app.put('/api/goals/:id', (req, res) => {
  const id   = Number(req.params.id);
  const idx  = db.goals.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.goals[idx] = { ...db.goals[idx], ...req.body, id };
  save();
  res.json(db.goals[idx]);
});

app.delete('/api/goals/:id', (req, res) => {
  const id = Number(req.params.id);
  db.goals = db.goals.filter(g => g.id !== id);
  save();
  res.json({ success: true });
});

// ── Debts ────────────────────────────────────────────────────────────────────
app.get('/api/debts', (req, res) => {
  res.json([...db.debts].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')));
});

app.post('/api/debts', (req, res) => {
  const { name, total_amount, paid_amount, installments, due_date } = req.body;
  const debt = { id: nextId('debts'), name, total_amount, paid_amount: paid_amount || 0, installments: installments || null, due_date: due_date || null };
  db.debts.push(debt);
  save();
  res.json(debt);
});

app.put('/api/debts/:id', (req, res) => {
  const id  = Number(req.params.id);
  const idx = db.debts.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.debts[idx] = { ...db.debts[idx], ...req.body, id };
  save();
  res.json(db.debts[idx]);
});

app.delete('/api/debts/:id', (req, res) => {
  const id = Number(req.params.id);
  db.debts = db.debts.filter(d => d.id !== id);
  save();
  res.json({ success: true });
});

// ── Contas Fixas — helpers ────────────────────────────────────────────────────
function lastDayOf(year, month) {
  return new Date(year, month, 0).getDate();
}

function ensureMonthInstances(month) {
  const [y, m] = month.split('-').map(Number);
  const ld = lastDayOf(y, m);
  let changed = false;
  db.fixedBills.filter(b => b.active).forEach(bill => {
    const exists = db.billInstances.some(i => i.bill_id === bill.id && i.reference_month === month);
    if (!exists) {
      const day = String(Math.min(bill.due_day, ld)).padStart(2, '0');
      db.billInstances.push({
        id: nextId('billInstances'),
        bill_id: bill.id,
        reference_month: month,
        amount: bill.amount,
        due_date: `${month}-${day}`,
        paid: false,
        paid_at: null,
        paid_amount: null,
      });
      changed = true;
    }
  });
  if (changed) save();
}

function withBillName(inst) {
  const bill = db.fixedBills.find(b => b.id === inst.bill_id);
  return { ...inst, bill_name: bill?.name ?? '(conta removida)', bill_due_day: bill?.due_day ?? null };
}

// Gera instâncias do mês atual ao iniciar o servidor
ensureMonthInstances(new Date().toISOString().slice(0, 7));

// ── Contas Fixas — templates ─────────────────────────────────────────────────
app.get('/api/fixed-bills', (req, res) => {
  res.json([...db.fixedBills].sort((a, b) => a.due_day - b.due_day));
});

app.post('/api/fixed-bills', (req, res) => {
  const { name, amount, due_day } = req.body;
  const bill = { id: nextId('fixedBills'), name, amount, due_day: Number(due_day), active: true };
  db.fixedBills.push(bill);

  // Cria instância do mês atual imediatamente
  const month = new Date().toISOString().slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const day = String(Math.min(bill.due_day, lastDayOf(y, m))).padStart(2, '0');
  db.billInstances.push({
    id: nextId('billInstances'),
    bill_id: bill.id,
    reference_month: month,
    amount: bill.amount,
    due_date: `${month}-${day}`,
    paid: false,
    paid_at: null,
    paid_amount: null,
  });
  save();
  res.json(bill);
});

app.put('/api/fixed-bills/:id', (req, res) => {
  const id  = Number(req.params.id);
  const idx = db.fixedBills.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.fixedBills[idx] = { ...db.fixedBills[idx], ...req.body, id };
  save();
  res.json(db.fixedBills[idx]);
});

app.delete('/api/fixed-bills/:id', (req, res) => {
  const id = Number(req.params.id);
  db.fixedBills    = db.fixedBills.filter(b => b.id !== id);
  db.billInstances = db.billInstances.filter(i => i.bill_id !== id);
  save();
  res.json({ success: true });
});

// ── Contas Fixas — instâncias mensais ─────────────────────────────────────────
app.get('/api/bill-instances', (req, res) => {
  const month = new Date().toISOString().slice(0, 7);
  ensureMonthInstances(month);

  // Mostra: todas do mês atual + pendentes de meses anteriores
  const rows = db.billInstances
    .filter(i => i.reference_month === month || !i.paid)
    .map(withBillName)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  res.json(rows);
});

app.post('/api/bill-instances/:id/pay', (req, res) => {
  const id  = Number(req.params.id);
  const idx = db.billInstances.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { paid_amount } = req.body;
  db.billInstances[idx] = {
    ...db.billInstances[idx],
    paid: true,
    paid_at: new Date().toISOString().slice(0, 10),
    paid_amount: paid_amount ?? db.billInstances[idx].amount,
  };
  save();
  res.json(withBillName(db.billInstances[idx]));
});

app.post('/api/bill-instances/:id/unpay', (req, res) => {
  const id  = Number(req.params.id);
  const idx = db.billInstances.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.billInstances[idx] = { ...db.billInstances[idx], paid: false, paid_at: null, paid_amount: null };
  save();
  res.json(withBillName(db.billInstances[idx]));
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Backend rodando em http://localhost:${PORT}\n`);
});
