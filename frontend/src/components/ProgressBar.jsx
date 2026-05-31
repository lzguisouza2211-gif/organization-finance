export default function ProgressBar({ value = 0, className = '', color = 'gradient', height = 'h-2' }) {
  const clamp = Math.min(100, Math.max(0, value))

  const fill = {
    gradient: 'linear-gradient(90deg, var(--grad-from), var(--grad-to))',
    success:  'linear-gradient(90deg, #10B981, #34D399)',
    danger:   'linear-gradient(90deg, #EF4444, #F87171)',
    warning:  'linear-gradient(90deg, #F59E0B, #FCD34D)',
  }[color] || color

  const glow = {
    gradient: '0 0 8px var(--grad-glow)',
    success:  '0 0 8px rgba(16,185,129,0.35)',
    danger:   '0 0 8px rgba(239,68,68,0.35)',
    warning:  '0 0 8px rgba(245,158,11,0.35)',
  }[color] || 'none'

  return (
    <div className={`rounded-full bg-white/8 overflow-hidden ${height} ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${clamp}%`, background: fill, boxShadow: glow }}
      />
    </div>
  )
}
