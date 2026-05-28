import { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={clsx('card text-center py-14 animate-fade-in', className)}>
      <div className="w-16 h-16 bg-[var(--border-soft)] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-5 text-sm px-6">
          {action.label}
        </button>
      )}
    </div>
  )
}

export { EmptyState }
