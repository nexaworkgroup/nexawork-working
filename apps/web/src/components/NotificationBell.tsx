import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, X, Briefcase, Zap, CheckCircle, Info, Calendar, Trophy, Shield } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { clsx } from 'clsx'

const TYPE_ICONS: Record<string, any> = {
  match:        Zap,
  application:  Briefcase,
  status:       CheckCircle,
  shortlisted:  CheckCircle,
  interview:    Calendar,
  offered:      Trophy,
  remote_ready: Shield,
  default:      Info,
}

const TYPE_COLORS: Record<string, string> = {
  match:        'text-brand-gold bg-brand-gold-light',
  application:  'text-blue-600 bg-blue-50',
  status:       'text-brand-green bg-brand-green-light',
  shortlisted:  'text-orange-500 bg-orange-50',
  interview:    'text-purple-600 bg-purple-50',
  offered:      'text-brand-gold bg-brand-gold-light',
  remote_ready: 'text-brand-green bg-brand-green-light',
  default:      'text-gray-500 bg-gray-100',
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 60_000,
    enabled: !!user
  })

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: open && !!user
  })

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-count'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const unread = countData?.count || 0
  const notifications = notifData?.notifications || []
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={() => markAllRead.mutate()}
                  className="text-xs text-brand-green hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you of new matches and updates</p>
              </div>
            ) : (
              notifications.map((n: any) => {
                const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.default
                const color = TYPE_COLORS[n.type] || TYPE_COLORS.default
                return (
                  <div key={n.id}
                    className={clsx('flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-surface transition-colors',
                      !n.is_read && 'bg-blue-50/30'
                    )}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-brand-green rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
          {/* View all link */}
          <div className="px-4 py-2.5 border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); navigate('/notifications') }}
              className="text-xs text-brand-green hover:underline font-medium w-full text-center">
              View all notifications →
            </button>
          </div>
      )}
    </div>
  )
}
