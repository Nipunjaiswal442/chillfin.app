'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden'

    const variants = {
      primary:
        'bg-gradient-to-r from-gold to-gold-dark text-bg-deep font-bold hover:-translate-y-0.5 shadow-[0_4px_30px_rgba(212,168,67,0.25)] hover:shadow-[0_8px_40px_rgba(212,168,67,0.4)]',
      secondary:
        'bg-transparent border border-metallic-grey text-silver-light hover:border-gold hover:text-gold-light hover:bg-[rgba(212,168,67,0.05)]',
      ghost: 'bg-transparent text-text-muted hover:text-gold-light hover:bg-[rgba(212,168,67,0.05)]',
      danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-10 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
