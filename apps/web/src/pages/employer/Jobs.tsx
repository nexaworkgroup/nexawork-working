import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import {
  PlusCircle, Users, Edit2, ToggleLeft, ToggleRight,
  MapPin, Calendar, Briefcase, BarChart2, Eye
} from 'lucide-react'
import { clsx } from 'clsx'

type TabType = 'active' | 'closed' | 'all'

export default function EmployerJobsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState<TabType>('active')

  const { data, isLoading } = useQuery({
    queryKey: ['employer-jobs-full'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data)
  })

  const toggleActive = useMutation({
    mutationFn: ({ jobId, active }: { jobId: string; active: boolean }) =>
      api.put(`/jobs/${jobId}`, { is_active: active }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['employer-jobs-full'] })
      success(vars.active ? 'Job posting activated' : 'Job posting closed')
    },
    onError: () => toastError('Failed to update job status')
  })

  const allJobs = data?.jobs || []
  const activeJobs = allJobs.filter((j: any) => j.is_active)
  const closedJobs = allJobs.filter((j: any) => !j.is_active)
  const displayed = tab === 'active' ? activeJobs : tab === 'closed' ? closedJobs : allJobs

  // Stats
  const totalApplicants = allJobs.reduce((sum: number, j: any) => {
    return sum + (Array.isArray(j.applications) ? (j.applications[0]?.count || 0) : 0)
  }, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {activeJobs.length} active · {closedJobs.length} closed · {totalApplicants} total applicants
          </p>
        </div>
        <button onClick={() => navigate('/employer/jobs/new')}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <PlusCircle size={16} /> Post New Job
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Jobs',      value: activeJobs.length,  icon: Briefcase, color: 'text-brand-green bg-brand-green-light' },
          { label: 'Closed Jobs',      value: closedJobs.length,  icon: ToggleLeft, color: 'text-gray-500 bg-gray-100' },
          { label: 'Total Applicants', value: totalApplicants,     icon: Users,     color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Postings',   value: allJobs.length,      icon: BarChart2, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'active', label: `Active (${activeJobs.length})` },
          { key: 'closed', label: `Closed (${closedJobs.length})` },
          { key: 'all',    label: `All (${allJobs.length})` },
        ] as { key: TabType; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all border',
              tab === key
                ? 'bg-brand-green text-white border-brand-green'
                : 'bg-[var(--surface)] text-gray-500 border-gray-200 hover:border-gray-300'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Job list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {tab === 'active' ? 'No active job postings' : tab === 'closed' ? 'No closed jobs' : 'No jobs posted yet'}
          </p>
          <button onClick={() => navigate('/employer/jobs/new')} className="btn-primary mt-4 text-sm px-6">
            Post Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((job: any) => {
            const appCount = Array.isArray(job.applications) ? (job.applications[0]?.count || 0) : 0
            return (
              <div key={job.id} className={clsx(
                'card transition-all',
                !job.is_active && 'opacity-60'
              )}>
                <div className="flex items-start gap-4">
                  {/* Job info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <span className={clsx('badge text-xs',
                        job.is_active ? 'badge-green' : 'bg-[var(--border-soft)] text-gray-500'
                      )}>
                        {job.is_active ? 'Active' : 'Closed'}
                      </span>
                      {job.job_type && (
                        <span className="badge badge-gray text-xs capitalize">
                          {job.job_type.replace('_', ' ')}
                        </span>
                      )}
                      {job.is_remote && <span className="badge bg-blue-50 text-blue-600 text-xs">Remote</span>}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      {job.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Expires {new Date(job.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Salary */}
                    {(job.salary_min || job.salary_max) && (
                      <p className="text-xs font-medium text-brand-green mt-1">
                        {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()} {job.salary_currency}/mo
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Applicant count */}
                    <button onClick={() => navigate(`/employer/jobs/${job.id}/candidates`)}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-green bg-gray-50 hover:bg-brand-green-light px-3 py-1.5 rounded-lg transition-all">
                      <Users size={14} />
                      {appCount} applicant{appCount !== 1 ? 's' : ''}
                    </button>

                    {/* Edit */}
                    <button onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-green transition-colors" title="Edit job">
                      <Edit2 size={15} />
                    </button>

                    {/* Toggle active/closed */}
                    <button
                      onClick={() => toggleActive.mutate({ jobId: job.id, active: !job.is_active })}
                      className={clsx('p-2 rounded-lg transition-colors', job.is_active
                        ? 'hover:bg-red-50 text-gray-400 hover:text-red-400'
                        : 'hover:bg-brand-green-light text-gray-400 hover:text-brand-green'
                      )}
                      title={job.is_active ? 'Close job posting' : 'Reactivate job posting'}>
                      {job.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </div>

                {/* Quick preview of description */}
                {job.description && (
                  <p className="mt-3 text-xs text-gray-400 line-clamp-2 border-t border-gray-50 pt-3">
                    {job.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
