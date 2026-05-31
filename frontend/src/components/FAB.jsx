import { Plus } from 'lucide-react'

export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-5 w-14 h-14 rounded-full grid place-items-center text-white z-40 ripple-wrapper btn-press"
      style={{
        bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
        boxShadow: '0 8px 32px var(--grad-glow)',
      }}
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  )
}
