import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { Plus, Briefcase, Users, TrendingUp, BarChart2, ArrowRight, Zap } from 'lucide-react'

export default function EmployerDashboard() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()

  const { data: analytics } = useQuery({
    queryKey: ['employer-analytics'],
    queryFn: () => api.get('/employer/analytics').then(r => r.data)
  })

  const { data: jobsData } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data)
  })

  const companyName = (profile as any)?.company_name || 'Your Company'
  const recentJobs = (jobsData?.jobs || []).slice(0, 5)

  const stats = [
    { label: 'Active Jobs',       value: analytics?.activeJobs ?? 0,      icon: Briefcase,  color: 'text-brand-green bg-brand-green-light',  onClick: () => navigate('/employer/jobs') },
    { label: 'Total Applicants',  value: analytics?.totalApplicants ?? 0,  icon: Users,      color: 'text-blue-600 bg-blue-50',               onClick: () => navigate('/employer/applicants') },
    { label: 'Avg Match Score',   value: analytics?.avgScore ? `${analytics.avgScore}%` : '—', icon: Zap, color: 'text-brand-gold-dark bg-brand-gold-light', onClick: undefined },
    { label: 'Total Postings',    value: analytics?.totalJobs ?? 0,        icon: BarChart2,  color: 'text-purple-600 bg-purple-50',           onClick: () => navigate('/employer/jobs') },
  ]

  const pipeline = analytics?.pipeline || {}

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {companyName} 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">Here's your hiring overview</p>
        </div>
        <button onClick={() => navigate('/employer/jobs/new')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Post a Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, onClick }) => (
          <div key={label} onClick={onClick}
            className={`card flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-card-hover transition-all' : ''}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      {Object.keys(pipeline).length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Application Pipeline</h2>
            <button onClick={() => navigate('/employer/applicants')}
              className="text-sm text-brand-green hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { key: 'applied',     label: 'Applied',      color: 'bg-[var(--border-soft)] text-gray-700' },
              { key: 'viewed',      label: 'Viewed',       color: 'bg-blue-50 text-blue-700' },
              { key: 'shortlisted', label: 'Shortlisted',  color: 'bg-brand-gold-light text-brand-gold-dark' },
              { key: 'interview',   label: 'Interview',    color: 'bg-purple-50 text-purple-700' },
              { key: 'offered',     label: 'Offered',      color: 'bg-brand-green-light text-brand-green' },
              { key: 'rejected',    label: 'Rejected',     color: 'bg-red-50 text-red-500' },
            ].map(({ key, label, color }) => (
              <div key={key} className={`rounded-xl p-3 text-center ${color}`}>
                <p className="text-2xl font-bold">{(pipeline as any)[key] || 0}</p>
                <p className="text-xs mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Job Postings</h2>
          <button onClick={() => navigate('/employer/jobs')}
            className="text-sm text-brand-green hover:underline flex items-center gap-1">
            Manage all <ArrowRight size={14} />
          </button>
        </div>
        {recentJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No jobs posted yet</p>
            <button onClick={() => navigate('/employer/jobs/new')} className="btn-primary mt-3 text-sm px-5">
              Post First Job
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.location} · {new Date(job.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`badge text-xs ${job.is_active ? 'badge-green' : 'bg-[var(--border-soft)] text-gray-500'}`}>
                  {job.is_active ? 'Active' : 'Closed'}
                </span>
                <button onClick={() => navigate(`/employer/jobs/${job.id}/candidates`)}
                  className="text-xs text-brand-green hover:underline flex-shrink-0">
                  {Array.isArray(job.applications) ? job.applications[0]?.count || 0 : 0} applicants
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
