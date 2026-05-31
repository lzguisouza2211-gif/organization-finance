import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, ChevronDown, CalendarDays, RefreshCw } from 'lucide-react'

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(false); return }
    setDisplayed('')
    setDone(false)
    let i = 0
    const tick = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(tick); setDone(true) }
    }, speed)
    return () => clearInterval(tick)
  }, [text, speed])

  return { displayed, done }
}

function MarkdownLine({ line }) {
  if (!line) return <br />

  if (/^###\s/.test(line)) return (
    <h3 className="text-[15px] font-bold text-white mt-4 mb-1">{line.replace(/^###\s/, '')}</h3>
  )
  if (/^##\s/.test(line)) return (
    <h2 className="text-[16px] font-extrabold text-white mt-5 mb-1">{line.replace(/^##\s/, '')}</h2>
  )
  if (/^#\s/.test(line)) return (
    <h1 className="text-[18px] font-extrabold text-white mt-5 mb-2">{line.replace(/^#\s/, '')}</h1>
  )

  const isBullet = /^[-*]\s/.test(line)
  const content = isBullet ? line.replace(/^[-*]\s/, '') : line

  const parts = content.split(/(\*\*[^*]+\*\*|R\$[\d.,]+|[\d]+%)/g)
  const rendered = parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part))
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>
    if (/^R\$[\d.,]+$/.test(part) || /^[\d]+%$/.test(part))
      return <span key={i} style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{part}</span>
    return part
  })

  if (isBullet) return (
    <li className="flex gap-2 mb-1 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>
      <span className="mt-[6px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--primary-light)' }} />
      <span>{rendered}</span>
    </li>
  )

  return (
    <p className="text-[13.5px] leading-relaxed mb-1" style={{ color: 'var(--text-dim)' }}>{rendered}</p>
  )
}

function MarkdownBlock({ text, cursor = false }) {
  const lines = text.split('\n')
  const elements = []
  let ulBuf = []

  const flushUl = () => {
    if (!ulBuf.length) return
    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-0.5 mb-2 pl-0 list-none">
        {ulBuf}
      </ul>
    )
    ulBuf = []
  }

  lines.forEach((line, i) => {
    const isBullet = /^[-*]\s/.test(line)
    if (isBullet) {
      ulBuf.push(<MarkdownLine key={i} line={line} />)
    } else {
      flushUl()
      elements.push(<MarkdownLine key={i} line={line} />)
    }
  })
  flushUl()

  return (
    <div>
      {elements}
      {cursor && <span className="typewriter-cursor" />}
    </div>
  )
}

/* ── Analysis Section ─────────────────────────────────────────────────────── */

function AnalysisSection() {
  const [rawText,   setRawText]   = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [expanded,  setExpanded]  = useState(true)
  const { displayed, done } = useTypewriter(rawText, 14)

  const run = async () => {
    setLoading(true)
    setError(null)
    setRawText(null)
    setExpanded(true)
    try {
      const res  = await fetch('/api/ai/analyze', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      setRawText(data.analysis)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-[24px] overflow-hidden mb-5 stagger-item"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(59,130,246,0.04))',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
          >
            <Sparkles size={17} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white leading-tight">Análise do Mês</p>
            <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Resumo completo da sua situação</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rawText && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <ChevronDown
                size={15}
                style={{ color: 'var(--text-dim)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          )}
          <button
            onClick={run}
            disabled={loading}
            className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5 disabled:opacity-50 btn-press ripple-wrapper"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
          >
            <Sparkles size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analisando...' : rawText ? 'Reanalisar' : 'Analisar meu mês'}
          </button>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="mx-5 my-4 p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-[13px] text-rose-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full typing-dot-1" style={{ background: 'var(--primary-light)' }} />
            <span className="w-2 h-2 rounded-full typing-dot-2" style={{ background: 'var(--primary-light)' }} />
            <span className="w-2 h-2 rounded-full typing-dot-3" style={{ background: 'var(--primary-light)' }} />
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-dim)' }}>Fin está analisando suas finanças...</p>
        </div>
      )}

      {rawText && expanded && (
        <div className="px-5 py-5">
          <MarkdownBlock text={displayed} cursor={!done} />
        </div>
      )}
    </div>
  )
}

/* ── Plan Section ─────────────────────────────────────────────────────────── */

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|R\$[\d.,]+|[\d]+%)/g)
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part))
      return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>
    if (/^R\$[\d.,]+$/.test(part) || /^[\d]+%$/.test(part))
      return <span key={i} style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{part}</span>
    return part
  })
}

function PlanTable({ lines }) {
  const isSep = (l) => /^\|[-:\s|]+\|$/.test(l.trim())
  const rows  = lines.filter(l => !isSep(l))
  const cells = (row) => row.trim().split('|').slice(1, -1).map(c => c.trim())
  if (rows.length < 2) return null
  const header = cells(rows[0])
  const data   = rows.slice(1)
  return (
    <div className="overflow-x-auto mb-4 rounded-xl" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr style={{ background: '#1E1E3A' }}>
            {header.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-bold text-white whitespace-nowrap">{renderInline(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 !== 0 ? 'rgba(255,255,255,0.025)' : 'transparent' }}>
              {cells(row).map((cell, ci) => (
                <td key={ci} className="px-4 py-2 border-t" style={{ color: 'var(--text-dim)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CheckboxItem({ label, checked, onToggle }) {
  return (
    <div className="flex items-start gap-3 mb-2 cursor-pointer" onClick={onToggle}>
      <div
        className="mt-[2px] w-4 h-4 rounded-[5px] shrink-0 flex items-center justify-center border transition-all"
        style={{
          background:   checked ? 'var(--primary-light)' : 'transparent',
          borderColor:  checked ? 'var(--primary-light)' : 'rgba(124,58,237,0.4)',
        }}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        className="text-[13px] leading-relaxed transition-all select-none"
        style={{
          color:          checked ? 'var(--text-dim)' : 'rgba(255,255,255,0.85)',
          textDecoration: checked ? 'line-through' : 'none',
          opacity:        checked ? 0.5 : 1,
        }}
      >
        {renderInline(label)}
      </span>
    </div>
  )
}

function PlanMarkdownBlock({ text, cursor = false, checkStates, onToggleCheck }) {
  const lines = text.split('\n')
  const elements = []
  let i = 0
  let cbIdx = 0

  while (i < lines.length) {
    const line = lines[i]

    // Table block: group consecutive | lines
    if (line.trim().startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(<PlanTable key={`tbl-${i}`} lines={tableLines} />)
      continue
    }

    // Checkbox item
    if (/^- \[[ x]\]\s/.test(line)) {
      const idx     = cbIdx++
      const checked = checkStates[idx] || false
      const label   = line.replace(/^- \[[ x]\]\s*/, '')
      elements.push(
        <CheckboxItem key={`cb-${i}`} label={label} checked={checked} onToggle={() => onToggleCheck(idx)} />
      )
      i++; continue
    }

    // Emoji section header (💰 ✅ 🏆 💳 🏠 📊 🐷 📋)
    if (/^\p{Emoji}/u.test(line) && line.trim().length > 1) {
      elements.push(
        <h2 key={`eh-${i}`} className="text-[15px] font-extrabold text-white mt-6 mb-3">{line}</h2>
      )
      i++; continue
    }

    // ATX headings
    if (/^###\s/.test(line)) { elements.push(<h3 key={`h3-${i}`} className="text-[13px] font-bold text-white mt-4 mb-1.5">{line.replace(/^###\s/, '')}</h3>); i++; continue }
    if (/^##\s/.test(line))  { elements.push(<h2 key={`h2-${i}`} className="text-[15px] font-extrabold text-white mt-5 mb-2">{line.replace(/^##\s/, '')}</h2>); i++; continue }
    if (/^#\s/.test(line))   { elements.push(<h1 key={`h1-${i}`} className="text-[17px] font-extrabold text-white mt-5 mb-2">{line.replace(/^#\s/, '')}</h1>); i++; continue }

    // Bullet
    if (/^[-*]\s/.test(line)) {
      elements.push(
        <li key={`li-${i}`} className="flex gap-2 mb-1.5 text-[13px] leading-relaxed list-none" style={{ color: 'var(--text-dim)' }}>
          <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--primary-light)' }} />
          <span>{renderInline(line.replace(/^[-*]\s/, ''))}</span>
        </li>
      )
      i++; continue
    }

    // Empty line
    if (!line.trim()) { elements.push(<div key={`br-${i}`} className="h-2" />); i++; continue }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-[13px] leading-relaxed mb-1" style={{ color: 'var(--text-dim)' }}>
        {renderInline(line)}
      </p>
    )
    i++
  }

  return (
    <div>
      {elements}
      {cursor && <span className="typewriter-cursor" />}
    </div>
  )
}

function PlanSkeleton() {
  return (
    <div className="px-5 py-5 space-y-3">
      <div className="h-5 rounded-full w-2/5 animate-pulse" style={{ background: 'rgba(124,58,237,0.15)' }} />
      <div className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.1)' }} />
      <div className="h-5 rounded-full w-1/3 mt-4 animate-pulse" style={{ background: 'rgba(124,58,237,0.15)' }} />
      {[80, 65, 75, 58, 70].map((w, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-4 h-4 rounded-[5px] shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }} />
          <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', width: `${w}%` }} />
        </div>
      ))}
      <div className="h-5 rounded-full w-2/5 mt-4 animate-pulse" style={{ background: 'rgba(124,58,237,0.15)' }} />
      <div className="h-3 rounded-full w-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="h-3 rounded-full w-5/6 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <p className="text-[12px] text-center mt-4 animate-pulse" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
        Fin está elaborando seu plano financeiro...
      </p>
    </div>
  )
}

function PlanSection() {
  const [rawText,     setRawText]     = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [expanded,    setExpanded]    = useState(true)
  const [checkStates, setCheckStates] = useState({})
  const { displayed, done } = useTypewriter(rawText, 10)

  const run = async () => {
    setLoading(true)
    setError(null)
    setRawText(null)
    setCheckStates({})
    setExpanded(true)
    try {
      const res  = await fetch('/api/ai/plan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      setRawText(data.plan)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleCheck = (idx) => setCheckStates(prev => ({ ...prev, [idx]: !prev[idx] }))

  const monthLabel = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  return (
    <div
      className="rounded-[24px] overflow-hidden mb-5 stagger-item"
      style={{ background: 'var(--surface)', border: '1px solid rgba(124,58,237,0.25)', animationDelay: '25ms' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-4"
        style={{
          background:   'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.04))',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
          >
            <CalendarDays size={17} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white leading-tight">📋 Plano do Mês</p>
            <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{monthTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rawText && !loading && (
            <>
              <button
                onClick={() => setExpanded(v => !v)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <ChevronDown
                  size={15}
                  style={{ color: 'var(--text-dim)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              <button
                onClick={run}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                title="Regenerar plano"
              >
                <RefreshCw size={13} style={{ color: 'var(--text-dim)' }} />
              </button>
            </>
          )}
          {(!rawText || loading) && (
            <button
              onClick={run}
              disabled={loading}
              className="h-9 px-4 rounded-full text-[13px] font-bold text-white flex items-center gap-1.5 disabled:opacity-50 btn-press ripple-wrapper"
              style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
            >
              <CalendarDays size={13} />
              {loading ? 'Gerando...' : 'Gerar Plano do Mês'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 my-4 p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-[13px] text-rose-400">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <PlanSkeleton />}

      {/* Plan content */}
      {rawText && !loading && expanded && (
        <div className="px-5 py-5">
          <PlanMarkdownBlock text={displayed} cursor={!done} checkStates={checkStates} onToggleCheck={toggleCheck} />
        </div>
      )}
    </div>
  )
}

/* ── Chat Section ─────────────────────────────────────────────────────────── */

const WELCOME = {
  role: 'assistant',
  content: 'Olá! Sou o Fin, seu economista pessoal 👋\n\nAnalisou seu mês hoje? Clique no botão acima ou me faça uma pergunta!',
}

const SUGGESTIONS = [
  'Como estão minhas dívidas?',
  'Onde posso economizar?',
  'Estou no caminho certo?',
]

function ChatBubble({ msg, isLast }) {
  const isUser = msg.role === 'user'
  return (
    <div
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isLast ? 'animate-[fadeUp_0.25s_ease_both]' : ''}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-black"
          style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
        >
          F
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={isUser
          ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))', border: '1px solid rgba(124,58,237,0.25)' }
          : { background: 'var(--surface-2)', border: '1px solid var(--border)' }
        }
      >
        <p className="text-[13.5px] text-white leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  )
}

function ChatSection() {
  const [messages, setMessages] = useState([WELCOME])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const history = messages.filter(m => m !== WELCOME)
    const next    = [...history, userMsg]
    setMessages([WELCOME, ...next])
    setInput('')
    setError(null)
    setLoading(true)

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res  = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const hasRealMessages = messages.some(m => m !== WELCOME && m.role === 'user')

  return (
    <div
      className="rounded-[24px] overflow-hidden flex flex-col stagger-item"
      style={{ minHeight: '440px', background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '50ms' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(59,130,246,0.03))' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-[13px] font-black"
          style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
        >
          F
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-bold text-white leading-tight">Chat com Fin</p>
          <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Seu economista pessoal</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full badge-online" style={{ background: 'var(--success)' }} />
          <span className="text-[11px] font-semibold text-emerald-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} isLast={i === messages.length - 1 && i > 0} />
        ))}

        {/* Suggestions (only before first user message) */}
        {!hasRealMessages && (
          <div className="flex flex-wrap gap-2 mt-2 pl-9">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-all btn-press"
                style={{
                  color: 'var(--primary-light)',
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-black"
              style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
            >
              F
            </div>
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full typing-dot-1" style={{ background: 'var(--text-dim)' }} />
              <span className="w-1.5 h-1.5 rounded-full typing-dot-2" style={{ background: 'var(--text-dim)' }} />
              <span className="w-1.5 h-1.5 rounded-full typing-dot-3" style={{ background: 'var(--text-dim)' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mx-1 p-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[12px] text-rose-400">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={onKey}
            placeholder="Pergunte ao Fin..."
            className="flex-1 rounded-2xl px-4 py-3 text-[15px] text-white placeholder-[var(--text-dim)] focus:outline-none resize-none transition-all no-scrollbar"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-2)',
              lineHeight: '1.5',
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 disabled:opacity-40 btn-press ripple-wrapper transition-all"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))', boxShadow: '0 4px 16px var(--grad-glow)' }}
          >
            <Send size={16} strokeWidth={2.2} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function AiPage() {
  return (
    <div className="px-4 pt-6 pb-6 sm:px-6 sm:pt-8 page-enter">
      {/* Fin identity header */}
      <div className="flex items-center gap-4 mb-7">
        <div className="relative shrink-0">
          <div
            className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white text-xl font-black glow-pulse"
            style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
          >
            F
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 badge-online"
            style={{ background: 'var(--success)', borderColor: 'var(--bg)' }}
          />
        </div>
        <div>
          <h1 className="text-[24px] font-extrabold text-white leading-tight">Fin</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-dim)' }}>Seu economista pessoal</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full badge-online" style={{ background: 'var(--success)' }} />
            <span className="text-[11px] font-semibold text-emerald-400">Online</span>
          </div>
        </div>
      </div>

      <AnalysisSection />
      <PlanSection />
      <ChatSection />
    </div>
  )
}
