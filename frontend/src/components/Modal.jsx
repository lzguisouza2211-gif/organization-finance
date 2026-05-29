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
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        className={`w-full bg-zinc-900 border-t border-white/10 rounded-t-[28px] flex flex-col transition-transform duration-[240ms] ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '86%' }}
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-[17px] font-bold text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-400 active:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto no-scrollbar px-5 pb-8 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
