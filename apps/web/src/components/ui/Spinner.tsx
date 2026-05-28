import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-[3px]', lg: 'w-12 h-12 border-4' }

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div className={clsx(
      sizes[size],
      'rounded-full border-[var(--border)] border-t-brand-green animate-spin',
      className
    )} />
  )
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-brand-green flex items-center justify-center animate-float">
          <span className="text-white font-bold text-xl">N</span>
        </div>
        <Spinner size="sm" />
      </div>
    </div>
  )
}
