'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg bg-bg-card border border-metallic-grey rounded-2xl p-6 shadow-2xl',
          className
        )}
      >
        <div className="flex items-center justify-between mb-5">
          {title && (
            <h3 className="font-playfair font-bold text-lg text-neon-white">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-text-muted hover:text-neon-white transition-colors p-1 rounded-lg hover:bg-metallic-grey"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
