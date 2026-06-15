import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Video, Phone, MapPin, CheckCircle } from 'lucide-react'
import { api } from '../lib/api'
import { clsx } from 'clsx'

const TYPE_ICONS: Record<string, any> = { video: Video, phone: Phone, in_person: MapPin }
const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-50 text-blue-600',
  confirmed:  'bg-brand-green-light text-brand-green',
  cancelled:  'bg-red-50 text-red-500',
  completed:  'bg-[var(--border-soft)] text-gray-500',
}

export default function InterviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: () => api.get('/seeker/interviews').then(r => r.data)
  })

  const interviews = data?.interviews || []
  const upcoming = interviews.filter((i: any) => ['scheduled', 'confirmed'].includes(i.status))
  const past = interviews.filter((i: any) => ['completed', 'cancelled'].includes(i.status))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={22} className="text-brand-green" /> Interviews
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Your upcoming and past interview schedules</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="card animate-pulse h-28" />)}</div>
      ) : interviews.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <Calendar size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No interviews yet</p>
          <p className="text-sm mt-1">Keep applying — interviews will appear here when employers schedule them</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((iv: any) => {
                  const Icon = TYPE_ICONS[iv.type] || Video
                  const date = new Date(iv.scheduled_at)
                  return (
                    <div key={iv.id} className="card border-l-4 border-brand-green">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-brand-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon size={20} className="text-brand-green" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-gray-900">{iv.jobs?.title}</p>
                            <span className={clsx('badge text-xs capitalize', STATUS_STYLES[iv.status])}>{iv.status}</span>
                          </div>
                          <p className="text-sm text-gray-500">{iv.jobs?.company_name}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {iv.duration_minutes}min
                            </span>
                          </div>
                          {iv.location && (
                            <p className="text-xs text-brand-green mt-1.5 flex items-center gap-1">
                              <Icon size={11} />
                              {iv.type === 'video' ? (
                                <a href={iv.location} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  Join Meeting →
                                </a>
                              ) : iv.location}
                            </p>
                          )}
                          {iv.notes && (
                            <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 italic">
                              📝 {iv.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Past</h2>
              <div className="space-y-2 opacity-70">
                {past.map((iv: any) => {
                  const Icon = TYPE_ICONS[iv.type] || Video
                  const date = new Date(iv.scheduled_at)
                  return (
                    <div key={iv.id} className="card">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon size={16} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 text-sm">{iv.jobs?.title} — {iv.jobs?.company_name}</p>
                          <p className="text-xs text-gray-400">{date.toLocaleDateString()}</p>
                        </div>
                        <span className={clsx('badge text-xs capitalize', STATUS_STYLES[iv.status])}>{iv.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
