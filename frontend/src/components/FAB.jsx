import { Plus } from 'lucide-react'

export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-5 bottom-[88px] w-14 h-14 rounded-full grid place-items-center text-white active:scale-90 transition-transform z-40"
      style={{
        background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))',
        boxShadow: '0 8px 32px var(--grad-glow)',
      }}
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  )
}
