import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
    } else {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(err.message)
      else setInfo('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(120% 60% at 50% 0%, #14141c 0%, #060608 55%)' }}
    >
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
              boxShadow: '0 12px 32px var(--grad-glow)',
            }}
          >
            <span className="text-white font-black text-2xl tabular-nums">$</span>
          </div>
          <h1 className="text-white font-extrabold text-[22px] tracking-tight">Finanças Pessoais</h1>
          <p className="text-zinc-500 text-[13px] mt-1">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 border border-white/8 rounded-[28px] p-6 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-[15px] placeholder-zinc-600 focus:outline-none focus:border-[var(--grad-to)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-[15px] placeholder-zinc-600 focus:outline-none focus:border-[var(--grad-to)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-rose-400 text-[13px] bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3">
                {error}
              </p>
            )}
            {info && (
              <p className="text-emerald-400 text-[13px] bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] disabled:opacity-50 active:scale-[0.98] transition-transform"
              style={{
                background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
                boxShadow: '0 4px 20px var(--grad-glow)',
              }}
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-5 text-center">
            {mode === 'login' ? (
              <p className="text-zinc-500 text-[13px]">
                Não tem conta?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setInfo('') }}
                  className="font-bold"
                  style={{ color: 'var(--grad-to)' }}
                >
                  Cadastrar
                </button>
              </p>
            ) : (
              <p className="text-zinc-500 text-[13px]">
                Já tem conta?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setInfo('') }}
                  className="font-bold"
                  style={{ color: 'var(--grad-to)' }}
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
