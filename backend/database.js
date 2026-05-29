const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'finance.json');

const pad  = (n) => String(n).padStart(2, '0');
const now  = new Date();
const year = now.getFullYear();
const mon  = now.getMonth() + 1;
const cm   = `${year}-${pad(mon)}`;
const pm   = mon === 1 ? `${year - 1}-12` : `${year}-${pad(mon - 1)}`;
const nm   = mon === 12 ? `${year + 1}-01` : `${year}-${pad(mon + 1)}`;

function seedData() {
  const cats = [
    { id:  1, name: 'Salário',          type: 'income',  color: '#10B981' },
    { id:  2, name: 'Freelance',        type: 'income',  color: '#3B82F6' },
    { id:  3, name: 'Investimentos',    type: 'income',  color: '#8B5CF6' },
    { id:  4, name: 'Outros (Receita)', type: 'income',  color: '#F59E0B' },
    { id:  5, name: 'Alimentação',      type: 'expense', color: '#EF4444' },
    { id:  6, name: 'Transporte',       type: 'expense', color: '#F97316' },
    { id:  7, name: 'Moradia',          type: 'expense', color: '#7C3AED' },
    { id:  8, name: 'Saúde',            type: 'expense', color: '#EC4899' },
    { id:  9, name: 'Lazer',            type: 'expense', color: '#06B6D4' },
    { id: 10, name: 'Educação',         type: 'expense', color: '#6366F1' },
    { id: 11, name: 'Vestuário',        type: 'expense', color: '#84CC16' },
    { id: 12, name: 'Outros (Gasto)',   type: 'expense', color: '#6B7280' },
  ];

  const transactions = [
    { id:  1, date: `${cm}-05`, amount: 5500.00, type: 'income',  category_id:  1, description: 'Salário maio' },
    { id:  2, date: `${cm}-10`, amount:  800.00, type: 'income',  category_id:  2, description: 'Projeto de design' },
    { id:  3, date: `${cm}-03`, amount:  450.00, type: 'expense', category_id:  5, description: 'Supermercado' },
    { id:  4, date: `${cm}-05`, amount:  200.00, type: 'expense', category_id:  6, description: 'Combustível' },
    { id:  5, date: `${cm}-08`, amount: 1200.00, type: 'expense', category_id:  7, description: 'Aluguel' },
    { id:  6, date: `${cm}-12`, amount:  150.00, type: 'expense', category_id:  8, description: 'Farmácia' },
    { id:  7, date: `${cm}-15`, amount:  350.00, type: 'expense', category_id:  9, description: 'Cinema e restaurante' },
    { id:  8, date: `${cm}-18`, amount:   89.90, type: 'expense', category_id: 10, description: 'Curso online' },
    { id:  9, date: `${cm}-20`, amount:  280.00, type: 'expense', category_id:  5, description: 'Restaurantes' },
    { id: 10, date: `${cm}-22`, amount:  120.00, type: 'expense', category_id:  6, description: 'Uber' },
    { id: 11, date: `${pm}-05`, amount: 5500.00, type: 'income',  category_id:  1, description: 'Salário' },
    { id: 12, date: `${pm}-15`, amount:  500.00, type: 'income',  category_id:  2, description: 'Consultoria' },
    { id: 13, date: `${pm}-03`, amount:  520.00, type: 'expense', category_id:  5, description: 'Supermercado' },
    { id: 14, date: `${pm}-05`, amount:  180.00, type: 'expense', category_id:  6, description: 'Gasolina' },
    { id: 15, date: `${pm}-08`, amount: 1200.00, type: 'expense', category_id:  7, description: 'Aluguel' },
    { id: 16, date: `${pm}-20`, amount:  420.00, type: 'expense', category_id:  9, description: 'Viagem fim de semana' },
    { id: 17, date: `${pm}-25`, amount:   95.00, type: 'expense', category_id:  8, description: 'Consulta médica' },
  ];

  const goals = [
    { id: 1, name: 'Fundo de emergência', target_amount: 15000.00, current_amount:  8500.00, deadline: `${year + 1}-06-30` },
    { id: 2, name: 'Viagem para Europa',  target_amount: 12000.00, current_amount:  3200.00, deadline: `${year + 1}-12-31` },
    { id: 3, name: 'Novo notebook',       target_amount:  4500.00, current_amount:  4500.00, deadline: `${cm}-30` },
  ];

  const debts = [
    { id: 1, name: 'Financiamento do carro', total_amount: 45000.00, paid_amount: 18000.00, installments: 60, due_date: `${year + 2}-${pad(mon)}-10` },
    { id: 2, name: 'Cartão de crédito',       total_amount:  2350.00, paid_amount:     0.00, installments:  1, due_date: `${nm}-15` },
    { id: 3, name: 'Empréstimo pessoal',      total_amount:  8000.00, paid_amount:  5000.00, installments: 24, due_date: `${year + 1}-03-20` },
  ];

  const fixedBills = [
    { id: 1, name: 'Aluguel',           amount: 1200.00, due_day: 10, active: true },
    { id: 2, name: 'Internet',          amount:   99.90, due_day: 15, active: true },
    { id: 3, name: 'Energia Elétrica',  amount:  180.00, due_day: 20, active: true },
    { id: 4, name: 'Água',              amount:   60.00, due_day: 20, active: true },
    { id: 5, name: 'Netflix',           amount:   39.90, due_day:  1, active: true },
    { id: 6, name: 'Celular',           amount:   89.90, due_day:  5, active: true },
  ];

  const billInstances = [
    // Mês atual — alguns pagos, alguns não
    { id: 1, bill_id: 5, reference_month: cm, amount:   39.90, due_date: `${cm}-01`, paid: true,  paid_at: `${cm}-01`, paid_amount:   39.90 },
    { id: 2, bill_id: 6, reference_month: cm, amount:   89.90, due_date: `${cm}-05`, paid: true,  paid_at: `${cm}-05`, paid_amount:   89.90 },
    { id: 3, bill_id: 1, reference_month: cm, amount: 1200.00, due_date: `${cm}-10`, paid: true,  paid_at: `${cm}-10`, paid_amount: 1200.00 },
    { id: 4, bill_id: 2, reference_month: cm, amount:   99.90, due_date: `${cm}-15`, paid: false, paid_at: null,       paid_amount: null    },
    { id: 5, bill_id: 3, reference_month: cm, amount:  180.00, due_date: `${cm}-20`, paid: false, paid_at: null,       paid_amount: null    },
    { id: 6, bill_id: 4, reference_month: cm, amount:   60.00, due_date: `${cm}-20`, paid: false, paid_at: null,       paid_amount: null    },
    // Mês anterior — Energia não foi paga (ficará como atrasada)
    { id: 7, bill_id: 3, reference_month: pm, amount:  165.00, due_date: `${pm}-20`, paid: false, paid_at: null,       paid_amount: null    },
  ];

  return {
    _seq: {
      categories: cats.length,
      transactions: transactions.length,
      goals: goals.length,
      debts: debts.length,
      fixedBills: fixedBills.length,
      billInstances: billInstances.length,
    },
    categories: cats,
    transactions,
    goals,
    debts,
    fixedBills,
    billInstances,
  };
}

const db = fs.existsSync(FILE)
  ? JSON.parse(fs.readFileSync(FILE, 'utf8'))
  : seedData();

function save() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
}

function nextId(table) {
  db._seq[table] = (db._seq[table] || 0) + 1;
  return db._seq[table];
}

// Migration: garante as tabelas novas em instâncias antigas do app
if (!db.fixedBills)    { db.fixedBills    = []; db._seq.fixedBills    = 0; }
if (!db.billInstances) { db.billInstances = []; db._seq.billInstances = 0; }
if (!db._seq.fixedBills)    db._seq.fixedBills    = db.fixedBills.length;
if (!db._seq.billInstances) db._seq.billInstances = db.billInstances.length;

if (!fs.existsSync(FILE)) {
  save();
  console.log('Banco de dados criado com dados de exemplo.');
}

module.exports = { db, save, nextId };
