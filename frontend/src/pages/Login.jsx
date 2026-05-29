import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-black text-2xl">$</span>
          </div>
          <h1 className="text-white font-bold text-xl">Finanças Pessoais</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}
            {info && (
              <p className="text-green-400 text-sm bg-green-900/30 border border-green-800 rounded-xl px-4 py-2.5">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <p className="text-gray-500 text-sm">
                Não tem conta?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setInfo('') }} className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Cadastrar
                </button>
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Já tem conta?{' '}
                <button onClick={() => { setMode('login'); setError(''); setInfo('') }} className="text-indigo-400 hover:text-indigo-300 font-medium">
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
