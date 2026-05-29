# Organização Financeira Pessoal

App web de finanças pessoais com React + Supabase, responsivo para desktop e mobile.

## Funcionalidades

- **Dashboard** — saldo do mês, receitas vs gastos, gráfico de pizza por categoria
- **Lançamentos** — registro de receitas e gastos com filtro por mês
- **Contas Fixas** — controle mensal de contas recorrentes; contas não pagas persistem no mês seguinte
- **Metas** — metas de economia com barra de progresso
- **Dívidas** — controle de parcelamentos com progresso de pagamento

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Gráficos | Recharts |
| Banco de dados | Supabase (PostgreSQL) |
| Deploy | Vercel |

## Como rodar localmente

### 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, execute o conteúdo de `supabase/schema.sql`
3. Em **Settings → API**, copie a **Project URL** e a **Publishable Key**

### 2. Variáveis de ambiente

Crie o arquivo `frontend/.env.local` com base no `.env.example`:

```env
VITE_SUPABASE_URL=https://xxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 3. Instalar e rodar

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`

## Deploy no Vercel

1. Importe este repositório no [Vercel](https://vercel.com)
2. Configure o **Root Directory** como `frontend`
3. Adicione as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`)
4. Clique em **Deploy**
