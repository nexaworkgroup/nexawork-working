import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { Plus, Briefcase, Users, TrendingUp, BarChart2 } from 'lucide-react'

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
  const jobs = jobsData?.jobs || []

  const stats = [
    { label: 'Active Jobs', value: analytics?.activeJobs ?? 0, icon: Briefcase, color: 'text-brand-green bg-brand-green-light' },
    { label: 'Total Applicants', value: analytics?.totalApplicants ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Avg Match Score', value: analytics?.avgScore ? `${analytics.avgScore}%` : '—', icon: TrendingUp, color: 'text-brand-gold-dark bg-brand-gold-light' },
    { label: 'Total Jobs Posted', value: analytics?.totalJobs ?? 0, icon: BarChart2, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {companyName} 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your job postings and candidates</p>
        </div>
        <button onClick={() => navigate('/employer/jobs/new')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Post a Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
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
      {analytics?.pipeline && (
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Application Pipeline</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(analytics.pipeline).map(([status, count]) => (
              <div key={status} className="text-center p-3 bg-surface rounded-lg">
                <p className="text-xl font-bold text-gray-900">{count as number}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jobs list */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Your Job Postings</h2>
        {jobs.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
            <p>No jobs posted yet.</p>
            <button onClick={() => navigate('/employer/jobs/new')} className="btn-primary mt-4">Post Your First Job</button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div key={job.id} className="card flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {job.location} · {job.job_type?.replace('_', ' ')} ·
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`badge ${job.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {job.is_active ? 'Active' : 'Closed'}
                  </span>
                  <button onClick={() => navigate(`/employer/jobs/${job.id}/candidates`)}
                    className="btn-secondary text-sm px-4 py-1.5 flex items-center gap-1.5">
                    <Users size={14} />
                    {Array.isArray(job.applications) ? job.applications[0]?.count || 0 : 0} Candidates
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
