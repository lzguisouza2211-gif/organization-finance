-- ═══════════════════════════════════════════════════════════════════════
--  Migração de Auth — execute no SQL Editor do Supabase
--  Adiciona isolamento por usuário em todas as tabelas
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Adiciona user_id nas tabelas de dados ──────────────────────────────────
ALTER TABLE transactions   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE goals          ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE debts          ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE fixed_bills    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bill_instances ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 2. Remove políticas antigas (que liberavam tudo para anon) ────────────────
DROP POLICY IF EXISTS "allow_all" ON transactions;
DROP POLICY IF EXISTS "allow_all" ON goals;
DROP POLICY IF EXISTS "allow_all" ON debts;
DROP POLICY IF EXISTS "allow_all" ON fixed_bills;
DROP POLICY IF EXISTS "allow_all" ON bill_instances;
DROP POLICY IF EXISTS "allow_all" ON categories;

-- ── 3. Cada usuário vê e altera apenas seus próprios dados ────────────────────
CREATE POLICY "own_data" ON transactions
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_data" ON goals
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_data" ON debts
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_data" ON fixed_bills
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_data" ON bill_instances
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Categorias são compartilhadas (leitura para todos autenticados) ────────
CREATE POLICY "read_categories" ON categories
  FOR SELECT TO authenticated USING (true);
