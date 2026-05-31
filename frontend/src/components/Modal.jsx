import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function Sheet({ title, onClose, children }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 240)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      {/* Desktop: centered dialog */}
      <div className="hidden sm:flex items-center justify-center absolute inset-0 p-4">
        <div
          className={`w-full max-w-md bg-[var(--surface)] border border-[var(--border-2)] rounded-[24px] shadow-2xl flex flex-col transition-all duration-[220ms] ${show ? 'modal-enter opacity-100' : 'opacity-0 scale-95'}`}
          style={{ maxHeight: '88dvh', boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px var(--border-2)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] shrink-0">
            <h2 className="text-[17px] font-bold text-white">{title}</h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-[var(--text-dim)] hover:bg-white/15 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          <div className="overflow-y-auto no-scrollbar px-6 flex-1 py-5">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className={`sm:hidden w-full bg-[var(--surface)] border-t border-[var(--border-2)] rounded-t-[28px] flex flex-col transition-transform duration-[240ms] ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-white/15" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-[17px] font-bold text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-[var(--text-dim)] active:bg-white/15 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto no-scrollbar px-5 flex-1" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
