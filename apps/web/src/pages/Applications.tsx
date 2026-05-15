import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Building2, MapPin, Clock, Trash2, ExternalLink } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { clsx } from 'clsx'
import { useState } from 'react'
import { ApplicationSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const STATUS_STYLES: Record<string, string> = {
  applied:     'bg-gray-100 text-gray-600',
  viewed:      'bg-blue-50 text-blue-600',
  shortlisted: 'bg-brand-gold-light text-brand-gold-dark',
  interview:   'bg-purple-50 text-purple-600',
  offered:     'bg-brand-green-light text-brand-green',
  rejected:    'bg-red-50 text-red-500',
}

export default function ApplicationsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.get('/seeker/applications').then(r => r.data)
  })

  const apps = data?.applications || []
  const filtered = filter === 'all' ? apps : apps.filter((a: any) => a.status === filter)

  const withdraw = useMutation({
    mutationFn: (appId: string) => api.delete(`/applications/${appId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      success('Application withdrawn')
      setWithdrawing(null)
    },
    onError: () => {
      toastError('Could not withdraw application')
      setWithdrawing(null)
    }
  })

  const statuses = ['all', 'applied', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected']

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('applications.title')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{apps.length} application{apps.length !== 1 ? 's' : ''} total</p>
      </div>

      {/* Status filter tabs */}
      {apps.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 flex-nowrap">
          {statuses.map(s => {
            const count = s === 'all' ? apps.length : apps.filter((a: any) => a.status === s).length
            if (s !== 'all' && count === 0) return null
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={clsx('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  filter === s
                    ? 'bg-brand-green text-white border-brand-green'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                )}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <ApplicationSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText}
          title={apps.length === 0 ? 'No applications yet' : 'No applications with this status'}
          description={apps.length === 0 ? 'Start applying to matched jobs!' : 'Try selecting a different filter'}
          action={apps.length === 0 ? { label: 'Browse Jobs', to: '/jobs' } : undefined} />
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => (
            <div key={app.id} className="card">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green font-bold text-sm flex-shrink-0">
                  {app.jobs?.company_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{app.jobs?.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><Building2 size={11} />{app.jobs?.company_name}</span>
                    {app.jobs?.location && <span className="flex items-center gap-1"><MapPin size={11} />{app.jobs.location}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} />{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={clsx('badge text-xs capitalize', STATUS_STYLES[app.status])}>
                    {app.status}
                  </span>
                  {app.ai_match_score && (
                    <span className="text-xs text-brand-green font-medium">{app.ai_match_score}%</span>
                  )}
                  {/* Withdraw — only for applied/viewed */}
                  {['applied', 'viewed'].includes(app.status) && (
                    withdrawing === app.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Withdraw?</span>
                        <button onClick={() => withdraw.mutate(app.id)}
                          className="text-xs text-red-500 font-medium hover:underline">Yes</button>
                        <button onClick={() => setWithdrawing(null)}
                          className="text-xs text-gray-400 hover:underline">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setWithdrawing(app.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors" title="Withdraw application">
                        <Trash2 size={15} />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Cover letter preview */}
              {app.cover_letter && (
                <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-50 pt-3 line-clamp-2">
                  "{app.cover_letter}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
