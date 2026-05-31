const variants = {
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  danger:  'bg-rose-500/15 text-rose-400 border border-rose-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  info:    'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  primary: 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  neutral: 'bg-white/8 text-zinc-400 border border-white/10',
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
