require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
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

// ── AI ────────────────────────────────────────────────────────────────────────
function fmtR(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildSystemPrompt() {
  const now      = new Date();
  const month    = now.toISOString().slice(0, 7);
  const dataAtual = now.toLocaleDateString('pt-BR');
  const mesAtual  = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const transactions   = db.transactions.filter(t => t.date.startsWith(month));
  const billInstances  = db.billInstances.filter(i => i.reference_month === month);

  const totalIncome    = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense   = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalPago      = billInstances.filter(i => i.paid).reduce((s, i) => s + (i.paid_amount || i.amount), 0);
  const totalPendente  = billInstances.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);

  const billName = (inst) => (db.fixedBills.find(b => b.id === inst.bill_id)?.name || '(conta)');

  const debtLines = db.debts.length
    ? db.debts.map(d => `- ${d.name}: total R$${fmtR(d.total_amount)} | pago R$${fmtR(d.paid_amount)} | restante R$${fmtR(d.total_amount - d.paid_amount)} | vence ${d.due_date || 'sem data'}`).join('\n')
    : 'Nenhuma dívida cadastrada.';

  const pagas     = billInstances.filter(i => i.paid).map(i => `${billName(i)} R$${fmtR(i.paid_amount || i.amount)}`).join(', ') || 'nenhuma';
  const pendentes = billInstances.filter(i => !i.paid).map(i => `${billName(i)} R$${fmtR(i.amount)} vence ${i.due_date}`).join(', ') || 'nenhuma';

  const txLines = transactions.length
    ? transactions.map(t => `- ${t.date} | ${t.type === 'income' ? 'Entrada' : 'Saída'} R$${fmtR(t.amount)} | ${t.description || '(sem descrição)'}`).join('\n')
    : 'Nenhuma transação neste mês.';

  const goalLines = db.goals.length
    ? db.goals.map(g => `- ${g.name}: meta R$${fmtR(g.target_amount)} | guardado R$${fmtR(g.current_amount)} | prazo ${g.deadline || 'sem prazo'}`).join('\n')
    : 'Nenhuma meta cadastrada.';

  return `PAPEL: Economista pessoal brasileiro. Seu nome é Fin.
IDIOMA: Português brasileiro sempre.
TOM: Profissional mas acessível. Sem termos técnicos desnecessários.
DADOS FINANCEIROS (atualizados em ${dataAtual}):

[DÍVIDAS]
${debtLines}

[CONTAS DO MÊS - ${mesAtual}]
Pagas: ${pagas}
Pendentes: ${pendentes}
Total pago: R$${fmtR(totalPago)} | Total pendente: R$${fmtR(totalPendente)}

[TRANSAÇÕES RECENTES]
${txLines}
Total entradas: R$${fmtR(totalIncome)} | Total saídas: R$${fmtR(totalExpense)}

[METAS]
${goalLines}

REGRAS:
- Nunca invente números
- Sempre cite valores reais ao dar conselhos
- Se faltar informação, peça ao usuário
- Respostas do chat: máximo 5 linhas
- Análise mensal: pode ser mais longa e detalhada`;
}

function buildPlanPrompt() {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);

  const transactions  = db.transactions.filter(t => t.date.startsWith(month));
  const billInstances = db.billInstances.filter(i => i.reference_month === month);

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const billName = (inst) => db.fixedBills.find(b => b.id === inst.bill_id)?.name || '(conta)';

  const debtLines = db.debts.length
    ? db.debts.map(d => `- ${d.name}: total R$${fmtR(d.total_amount)} | pago R$${fmtR(d.paid_amount)} | restante R$${fmtR(d.total_amount - d.paid_amount)} | parcelas: ${d.installments || 'N/A'}`).join('\n')
    : 'Nenhuma dívida cadastrada.';

  const pendentes = billInstances.filter(i => !i.paid)
    .map(i => `- ${billName(i)}: R$${fmtR(i.amount)} vence ${i.due_date}`).join('\n') || 'Nenhuma pendente.';

  const pagas = billInstances.filter(i => i.paid)
    .map(i => `- ${billName(i)}: R$${fmtR(i.paid_amount || i.amount)} pago em ${i.paid_at}`).join('\n') || 'Nenhuma paga ainda.';

  const expenseLines = transactions.filter(t => t.type === 'expense').map(t => {
    const cat = db.categories.find(c => c.id === t.category_id);
    return `- ${t.description || '(sem descrição)'}: R$${fmtR(t.amount)} (${cat?.name || 'Sem categoria'})`;
  }).join('\n') || 'Nenhum gasto variável registrado.';

  const goalLines = db.goals.length
    ? db.goals.map(g => `- ${g.name}: meta R$${fmtR(g.target_amount)} | guardado R$${fmtR(g.current_amount)} | prazo ${g.deadline || 'sem prazo'}`).join('\n')
    : 'Nenhuma meta cadastrada.';

  const system = `PAPEL: Economista pessoal brasileiro. Nome: Fin.
IDIOMA: Português brasileiro sempre.
TOM: Direto, encorajador, baseado em dados reais.

DADOS FINANCEIROS DO USUÁRIO:

[RENDA]
Receita do mês: R$${fmtR(totalIncome)}

[DÍVIDAS]
${debtLines}

[CONTAS FIXAS PENDENTES]
${pendentes}

[CONTAS FIXAS PAGAS]
${pagas}

[GASTOS VARIÁVEIS DO MÊS]
${expenseLines}
Total gasto: R$${fmtR(totalExpense)}

[METAS]
${goalLines}

REGRAS:
- Use apenas os dados reais acima
- Nunca invente valores
- Seja específico com datas e valores
- Tom encorajador mas realista`;

  const user = `Gere um plano financeiro completo para este mês seguindo exatamente esta estrutura:

💰 ORÇAMENTO DO MÊS
Tabela com: Destino | Valor | Quando
Mostre como distribuir a renda entre contas, dívidas, gastos variáveis e reserva.
Calcule e mostre a sobra ao final.

✅ METAS DO MÊS
Liste metas concretas e alcançáveis divididas em:

💳 Dívidas (quais pagar/quitar esse mês)
🏠 Contas (metas de pagamento)
📊 Gastos (limites por categoria)
🐷 Reserva (quanto guardar)
📋 Hábito (metas de comportamento financeiro)

Cada meta deve ter checkbox [ ] e ser específica com valor ou ação clara.

🏆 O QUE ESTE MÊS REPRESENTA
Parágrafo motivacional mostrando o impacto real de cumprir o plano.
Quantas dívidas serão quitadas, como o saldo devedor vai mudar, o que muda na vida financeira do usuário.
Seja específico, use os dados reais, e termine com uma frase de incentivo.`;

  return { system, user };
}

app.post('/api/ai/plan', async (req, res) => {
  try {
    const { system, user } = buildPlanPrompt();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    });
    res.json({ plan: msg.content[0].text });
  } catch (err) {
    console.error('[AI plan]', err.message);
    res.status(500).json({ error: 'Erro ao gerar o plano. Verifique a chave ANTHROPIC_API_KEY.' });
  }
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: 'Faça uma análise completa da minha situação financeira do mês atual.' }],
    });
    res.json({ analysis: msg.content[0].text });
  } catch (err) {
    console.error('[AI analyze]', err.message);
    res.status(500).json({ error: 'Erro ao consultar a IA. Verifique a chave ANTHROPIC_API_KEY.' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Campo messages inválido.' });
    }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages,
    });
    res.json({ reply: msg.content[0].text });
  } catch (err) {
    console.error('[AI chat]', err.message);
    res.status(500).json({ error: 'Erro ao consultar a IA. Verifique a chave ANTHROPIC_API_KEY.' });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Backend rodando em http://localhost:${PORT}\n`);
});
