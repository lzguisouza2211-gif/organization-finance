-- ═══════════════════════════════════════════════════════════════════════
--  Organização Financeira Pessoal — Schema Supabase
--  Cole tudo isso no SQL Editor do Supabase e clique em "Run"
-- ═══════════════════════════════════════════════════════════════════════

-- ── Tabelas ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT   NOT NULL,
  type  TEXT   NOT NULL CHECK (type IN ('income','expense','both')),
  color TEXT   NOT NULL DEFAULT '#6B7280'
);

CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL        PRIMARY KEY,
  date        DATE          NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  type        TEXT          NOT NULL CHECK (type IN ('income','expense')),
  category_id INTEGER       REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id             SERIAL        PRIMARY KEY,
  name           TEXT          NOT NULL,
  target_amount  NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline       DATE,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debts (
  id           SERIAL        PRIMARY KEY,
  name         TEXT          NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  paid_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  installments INTEGER,
  due_date     DATE,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixed_bills (
  id      SERIAL        PRIMARY KEY,
  name    TEXT          NOT NULL,
  amount  NUMERIC(12,2) NOT NULL,
  due_day INTEGER       NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active  BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bill_instances (
  id              SERIAL        PRIMARY KEY,
  bill_id         INTEGER       NOT NULL REFERENCES fixed_bills(id) ON DELETE CASCADE,
  reference_month TEXT          NOT NULL,       -- formato 'YYYY-MM'
  amount          NUMERIC(12,2) NOT NULL,
  due_date        DATE          NOT NULL,
  paid            BOOLEAN       NOT NULL DEFAULT FALSE,
  paid_at         DATE,
  paid_amount     NUMERIC(12,2)
);

-- ── Row Level Security (permite tudo para anon — app pessoal) ─────────────────

ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_bills    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON categories     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON transactions   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON goals          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON debts          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON fixed_bills    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON bill_instances FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Categorias padrão ────────────────────────────────────────────────────────

INSERT INTO categories (name, type, color) VALUES
  ('Salário',          'income',  '#10B981'),
  ('Freelance',        'income',  '#3B82F6'),
  ('Investimentos',    'income',  '#8B5CF6'),
  ('Outros (Receita)', 'income',  '#F59E0B'),
  ('Alimentação',      'expense', '#EF4444'),
  ('Transporte',       'expense', '#F97316'),
  ('Moradia',          'expense', '#7C3AED'),
  ('Saúde',            'expense', '#EC4899'),
  ('Lazer',            'expense', '#06B6D4'),
  ('Educação',         'expense', '#6366F1'),
  ('Vestuário',        'expense', '#84CC16'),
  ('Outros (Gasto)',   'expense', '#6B7280');

