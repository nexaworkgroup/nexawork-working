import { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; to?: string; onClick?: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-gray-300" />
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-6">{description}</p>}
      {action && (
        action.to
          ? <Link to={action.to} className="btn-primary text-sm px-6 py-2">{action.label}</Link>
          : <button onClick={action.onClick} className="btn-primary text-sm px-6 py-2">{action.label}</button>
      )}
    </div>
  )
}
