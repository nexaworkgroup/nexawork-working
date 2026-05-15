import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileText, Building2, MapPin, Clock } from 'lucide-react'
import { api } from '../lib/api'
import { clsx } from 'clsx'

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

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.get('/seeker/applications').then(r => r.data)
  })

  const apps = data?.applications || []

  const grouped = apps.reduce((acc: Record<string, any[]>, app: any) => {
    acc[app.status] = [...(acc[app.status] || []), app]
    return acc
  }, {})

  const statusOrder = ['applied', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected']

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('applications.title')}</h1>
        <p className="text-gray-400 text-sm mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''} total</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t('applications.empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.filter(s => grouped[s]?.length).map(status => (
            <div key={status}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className={clsx('w-2 h-2 rounded-full inline-block', STATUS_STYLES[status]?.split(' ')[0])} />
                {t(`applications.status_${status}` as any)} ({grouped[status].length})
              </h2>
              <div className="space-y-3">
                {grouped[status].map((app: any) => (
                  <div key={app.id} className="card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green font-bold text-sm flex-shrink-0">
                      {app.jobs?.company_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{app.jobs?.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Building2 size={11} /> {app.jobs?.company_name}</span>
                        {app.jobs?.location && <span className="flex items-center gap-1"><MapPin size={11} /> {app.jobs.location}</span>}
                        <span className="flex items-center gap-1"><Clock size={11} /> {t('applications.applied_on', { date: new Date(app.created_at).toLocaleDateString() })}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={clsx('badge text-xs', STATUS_STYLES[app.status])}>
                        {t(`applications.status_${app.status}` as any)}
                      </span>
                      {app.ai_match_score && (
                        <span className="text-xs text-brand-green font-medium">{app.ai_match_score}% match</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
