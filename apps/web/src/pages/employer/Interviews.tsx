import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Video, Phone, MapPin, Users, CheckCircle, XCircle, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import { clsx } from 'clsx'

const TYPE_ICONS: Record<string, any> = { video: Video, phone: Phone, in_person: MapPin }
const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-50 text-blue-600 border-blue-200',
  confirmed:  'bg-brand-green-light text-brand-green border-brand-green/30',
  cancelled:  'bg-red-50 text-red-500 border-red-200',
  completed:  'bg-[var(--border-soft)] text-gray-500 border-gray-200',
}
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed'
}

type Tab = 'upcoming' | 'past' | 'all'

export default function EmployerInterviewsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState<Tab>('upcoming')

  const { data, isLoading } = useQuery({
    queryKey: ['employer-interviews'],
    queryFn: () => api.get('/employer/interviews').then(r => r.data)
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/employer/interviews/${id}`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['employer-interviews'] })
      success(`Interview marked as ${vars.status}`)
    },
    onError: () => toastError('Failed to update interview')
  })

  const allInterviews = data?.interviews || []
  const now = new Date()
  const upcoming = allInterviews.filter((i: any) => new Date(i.scheduled_at) >= now && ['scheduled', 'confirmed'].includes(i.status))
  const past = allInterviews.filter((i: any) => new Date(i.scheduled_at) < now || ['completed', 'cancelled'].includes(i.status))
  const displayed = tab === 'upcoming' ? upcoming : tab === 'past' ? past : allInterviews

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={22} className="text-brand-green" /> Interviews
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button onClick={() => navigate('/employer/applicants')}
          className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
          <Users size={16} /> Schedule from Applicants
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Upcoming',  value: upcoming.length,  color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed', value: allInterviews.filter((i: any) => i.status === 'completed').length, color: 'text-brand-green bg-brand-green-light' },
          { label: 'Confirmed', value: allInterviews.filter((i: any) => i.status === 'confirmed').length, color: 'text-purple-600 bg-purple-50' },
          { label: 'Cancelled', value: allInterviews.filter((i: any) => i.status === 'cancelled').length, color: 'text-red-500 bg-red-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'past',     label: `Past (${past.length})` },
          { key: 'all',      label: `All (${allInterviews.length})` },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all border',
              tab === key ? 'bg-brand-green text-white border-brand-green' : 'bg-[var(--surface)] text-gray-500 border-gray-200 hover:border-gray-300'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Interview list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-28" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <Calendar size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">
            {tab === 'upcoming' ? 'No upcoming interviews' : tab === 'past' ? 'No past interviews' : 'No interviews scheduled yet'}
          </p>
          <p className="text-sm mt-1 mb-4">Schedule interviews from the Applicants page</p>
          <button onClick={() => navigate('/employer/applicants')} className="btn-primary text-sm px-6">
            Go to Applicants
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((iv: any) => {
            const Icon = TYPE_ICONS[iv.type] || Video
            const date = new Date(iv.scheduled_at)
            const isPast = date < now
            const seekerName = iv.profiles_seeker?.full_name || 'Candidate'

            return (
              <div key={iv.id} className={clsx('card transition-all', isPast && iv.status === 'scheduled' && 'opacity-70')}>
                <div className="flex items-start gap-4">
                  {/* Date block */}
                  <div className="w-14 flex-shrink-0 text-center">
                    <div className={clsx('rounded-xl p-2', STATUS_STYLES[iv.status])}>
                      <p className="text-lg font-bold leading-none">{date.getDate()}</p>
                      <p className="text-xs font-medium mt-0.5">{date.toLocaleString('default', { month: 'short' })}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900">{seekerName}</p>
                      <span className={clsx('badge text-xs border', STATUS_STYLES[iv.status])}>
                        {STATUS_LABELS[iv.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{iv.jobs?.title}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Clock size={11} />
                        {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {iv.duration_minutes}min
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        <Icon size={11} /> {iv.type?.replace('_', ' ')}
                      </span>
                      {iv.location && (
                        <span className="flex items-center gap-1 text-brand-green">
                          {iv.type === 'video'
                            ? <a href={iv.location} target="_blank" rel="noopener noreferrer" className="hover:underline">Join Meeting →</a>
                            : iv.location}
                        </span>
                      )}
                    </div>
                    {iv.notes && (
                      <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded-lg p-2 italic">📝 {iv.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {['scheduled', 'confirmed'].includes(iv.status) && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {iv.status === 'scheduled' && (
                        <button onClick={() => updateStatus.mutate({ id: iv.id, status: 'confirmed' })}
                          className="flex items-center gap-1 text-xs text-brand-green font-medium bg-brand-green-light px-3 py-1.5 rounded-lg hover:bg-brand-green hover:text-white transition-all">
                          <CheckCircle size={13} /> Confirm
                        </button>
                      )}
                      <button onClick={() => updateStatus.mutate({ id: iv.id, status: 'completed' })}
                        className="flex items-center gap-1 text-xs text-purple-600 font-medium bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-all">
                        <CheckCircle size={13} /> Completed
                      </button>
                      <button onClick={() => updateStatus.mutate({ id: iv.id, status: 'cancelled' })}
                        className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all">
                        <XCircle size={13} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
