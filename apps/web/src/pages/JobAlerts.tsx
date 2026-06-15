import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Plus, Trash2, BellOff, MapPin, Briefcase, Search } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { clsx } from 'clsx'

const FREQUENCIES = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

const JOB_TYPES = ['full_time', 'part_time', 'internship', 'contract', 'graduate_scheme']

export default function JobAlertsPage() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ keywords: '', location: '', job_type: '', frequency: 'daily' })

  const { data, isLoading } = useQuery({
    queryKey: ['job-alerts'],
    queryFn: () => api.get('/seeker/job-alerts').then(r => r.data)
  })

  const createAlert = useMutation({
    mutationFn: () => api.post('/seeker/job-alerts', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-alerts'] })
      success('Job alert created! We\'ll notify you of new matches.')
      setCreating(false)
      setForm({ keywords: '', location: '', job_type: '', frequency: 'daily' })
    },
    onError: (e: any) => toastError(e.message || 'Failed to create alert')
  })

  const deleteAlert = useMutation({
    mutationFn: (id: string) => api.delete(`/seeker/job-alerts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-alerts'] })
      success('Alert deleted')
    }
  })

  const toggleAlert = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/seeker/job-alerts/${id}`, { is_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-alerts'] })
  })

  const alerts = data?.alerts || []

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={22} className="text-brand-green" /> Job Alerts
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Get notified when new jobs match your criteria</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={16} /> New Alert
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card mb-6 border-brand-green/30 border-2">
          <h2 className="font-semibold text-gray-900 mb-4">Create Job Alert</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Keywords *
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
                  className="input-field pl-9" placeholder="e.g. Software Engineer, React, Marketing..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    className="input-field pl-9" placeholder="Douala, Remote..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Type</label>
                <select value={form.job_type} onChange={e => setForm(p => ({ ...p, job_type: e.target.value }))}
                  className="input-field">
                  <option value="">All types</option>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Frequency</label>
              <div className="flex gap-2">
                {FREQUENCIES.map(f => (
                  <button key={f.value} onClick={() => setForm(p => ({ ...p, frequency: f.value }))}
                    className={clsx('flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                      form.frequency === f.value
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-[var(--surface)] text-gray-500 border-gray-200 hover:border-gray-300')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setCreating(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => createAlert.mutate()} disabled={!form.keywords.trim() || createAlert.isPending}
              className="btn-primary flex-1">
              {createAlert.isPending ? 'Creating…' : 'Create Alert'}
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-14 text-gray-400">
          <Bell size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No alerts yet</p>
          <p className="text-sm mt-1">Create your first alert to get notified of new matching jobs</p>
          <button onClick={() => setCreating(true)} className="btn-primary mt-4 text-sm px-6">
            Create Alert
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div key={alert.id} className={clsx('card transition-all', !alert.is_active && 'opacity-60')}>
              <div className="flex items-start gap-3">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  alert.is_active ? 'bg-brand-green-light' : 'bg-[var(--border-soft)]')}>
                  <Bell size={16} className={alert.is_active ? 'text-brand-green' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{alert.keywords}</p>
                    <span className={clsx('badge text-xs', alert.is_active ? 'badge-green' : 'bg-[var(--border-soft)] text-gray-500')}>
                      {alert.is_active ? '🟢 Active' : 'Paused'}
                    </span>
                    <span className="badge badge-gray text-xs capitalize">{alert.frequency}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    {alert.location && <span className="flex items-center gap-1"><MapPin size={10} />{alert.location}</span>}
                    {alert.job_type && <span className="flex items-center gap-1"><Briefcase size={10} />{alert.job_type.replace('_',' ')}</span>}
                    <span>Created {new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleAlert.mutate({ id: alert.id, active: !alert.is_active })}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-brand-green" title="Toggle alert">
                    {alert.is_active ? <Bell size={15} /> : <BellOff size={15} />}
                  </button>
                  <button onClick={() => deleteAlert.mutate(alert.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-300 hover:text-red-400" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
