import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
  Bell, Briefcase, Zap, CheckCircle, Trophy,
  Calendar, Shield, Star, MessageSquare, Info,
  CheckCheck, Trash2, ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'

// ── Notification type config ─────────────────────────────
const TYPE_CONFIG: Record<string, {
  icon: any; color: string; bg: string; label: string; action?: string
}> = {
  interview:    { icon: Calendar,      color: 'text-purple-600', bg: 'bg-purple-50',       label: 'Interview',     action: '/applications' },
  offered:      { icon: Trophy,        color: 'text-brand-gold', bg: 'bg-brand-gold-light', label: 'Offer',         action: '/applications' },
  shortlisted:  { icon: Star,          color: 'text-orange-500', bg: 'bg-orange-50',        label: 'Shortlisted',   action: '/applications' },
  status:       { icon: CheckCircle,   color: 'text-brand-green',bg: 'bg-brand-green-light',label: 'Update',        action: '/applications' },
  application:  { icon: Briefcase,     color: 'text-blue-600',   bg: 'bg-blue-50',          label: 'Application',   action: '/applications' },
  match:        { icon: Zap,           color: 'text-brand-gold', bg: 'bg-brand-gold-light', label: 'Job Match',     action: '/jobs' },
  remote_ready: { icon: Shield,        color: 'text-brand-green',bg: 'bg-brand-green-light',label: 'Remote Ready',  action: '/remote-ready' },
  interview_scheduled: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50',      label: 'Scheduled',     action: '/interviews' },
  chat:         { icon: MessageSquare, color: 'text-blue-500',   bg: 'bg-blue-50',          label: 'Message',       action: '/chat' },
  default:      { icon: Info,          color: 'text-gray-500',   bg: 'bg-gray-100',         label: 'Info',          action: undefined },
}

function getConfig(type: string) {
  // Match partial types (e.g. "status_interview" → interview)
  if (type?.includes('interview')) return TYPE_CONFIG.interview
  if (type?.includes('offer'))     return TYPE_CONFIG.offered
  if (type?.includes('shortlist')) return TYPE_CONFIG.shortlisted
  if (type?.includes('match'))     return TYPE_CONFIG.match
  if (type?.includes('remote'))    return TYPE_CONFIG.remote_ready
  return TYPE_CONFIG[type] || TYPE_CONFIG.default
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Group notifications by date
function groupByDate(notifications: any[]) {
  const groups: Record<string, any[]> = {}
  notifications.forEach(n => {
    const date = new Date(n.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    let key: string
    if (date.toDateString() === today.toDateString())         key = 'Today'
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday'
    else key = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn:  () => api.get('/notifications?limit=50').then(r => r.data),
    refetchInterval: 30_000,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-page'] })
      qc.invalidateQueries({ queryKey: ['notif-count'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markOneRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`, {})
    qc.invalidateQueries({ queryKey: ['notifications-page'] })
    qc.invalidateQueries({ queryKey: ['notif-count'] })
  }

  const notifications: any[] = data?.notifications || []
  const unreadCount = notifications.filter(n => !n.is_read).length
  const grouped = groupByDate(notifications)

  const handleClick = async (n: any) => {
    if (!n.is_read) await markOneRead(n.id)
    const config = getConfig(n.type)
    if (config.action) navigate(config.action)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-sm text-brand-green hover:underline font-medium"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={24} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">No notifications yet</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            You'll be notified here when employers view your application, schedule interviews, or make offers.
          </p>
        </div>
      )}

      {/* Grouped list */}
      {!isLoading && Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel} className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {dateLabel}
          </p>
          <div className="space-y-2">
            {items.map((n: any) => {
              const cfg   = getConfig(n.type)
              const Icon  = cfg.icon
              const isNew = !n.is_read

              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={clsx(
                    'w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all',
                    isNew
                      ? 'bg-white border-brand-green/20 shadow-sm hover:shadow-md'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  )}
                >
                  {/* Icon */}
                  <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <Icon size={18} className={cfg.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={clsx('text-sm leading-snug', isNew ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                        {isNew && <span className="w-2 h-2 bg-brand-green rounded-full" />}
                      </div>
                    </div>
                    {n.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    {/* Type badge + action hint */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                      {cfg.action && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          View details <ChevronRight size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
