import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { TrendingUp, Users, Briefcase, Zap, Clock, CheckCircle, BarChart2, Target } from 'lucide-react'
import { clsx } from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  applied:     '#6b7280',
  viewed:      '#3b82f6',
  shortlisted: '#f59e0b',
  interview:   '#8b5cf6',
  offered:     '#1A7A4A',
  rejected:    '#ef4444',
}

export default function EmployerAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['employer-analytics-full'],
    queryFn: () => api.get('/employer/analytics').then(r => r.data)
  })

  const { data: jobsData } = useQuery({
    queryKey: ['employer-jobs-analytics'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data)
  })

  const s = data || {}
  const jobs = jobsData?.jobs || []
  const pipeline = s.pipeline || {}

  const totalApps = Object.values(pipeline).reduce((sum: number, v: any) => sum + v, 0) as number
  const conversionRate = totalApps > 0 && pipeline.offered
    ? Math.round((pipeline.offered / totalApps) * 100)
    : 0

  // Job performance
  const jobPerformance = jobs.slice(0, 10).map((j: any) => ({
    title: j.title,
    applications: Array.isArray(j.applications) ? (j.applications[0]?.count || 0) : 0,
    active: j.is_active
  })).sort((a: any, b: any) => b.applications - a.applications)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart2 size={22} className="text-brand-green" /> Hiring Analytics
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Track your recruitment performance</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Jobs',       value: s.activeJobs       || 0, icon: Briefcase,   color: 'text-brand-green bg-brand-green-light' },
              { label: 'Total Applicants',  value: s.totalApplicants  || 0, icon: Users,       color: 'text-blue-600 bg-blue-50' },
              { label: 'Avg Match Score',   value: s.avgScore ? `${s.avgScore}%` : '—', icon: Zap, color: 'text-brand-gold-dark bg-brand-gold-light' },
              { label: 'Offer Rate',        value: `${conversionRate}%`, icon: Target, color: 'text-purple-600 bg-purple-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline Funnel */}
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-900 mb-5">Application Pipeline</h2>
            <div className="space-y-3">
              {['applied', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected'].map(status => {
                const count = (pipeline as any)[status] || 0
                const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-sm capitalize text-gray-500 w-24 flex-shrink-0">{status}</span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: STATUS_COLORS[status] }}>
                        {pct > 10 && <span className="text-xs text-white font-semibold">{count}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">{count} ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Job Performance */}
          {jobPerformance.length > 0 && (
            <div className="card mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Job Performance</h2>
              <div className="space-y-3">
                {jobPerformance.map((job: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-green rounded-full"
                            style={{ width: `${Math.min(100, (job.applications / Math.max(...jobPerformance.map((j: any) => j.applications), 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={clsx('badge text-xs', job.active ? 'badge-green' : 'bg-gray-100 text-gray-500')}>
                        {job.active ? 'Active' : 'Closed'}
                      </span>
                      <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                        {job.applications} <span className="text-xs text-gray-400">apps</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time to hire insight */}
          <div className="card bg-brand-green-light border-brand-green/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">💡 Hiring Insight</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {conversionRate === 0
                    ? "Start reviewing applications to track your hiring pipeline performance."
                    : conversionRate < 5
                    ? `Your offer rate is ${conversionRate}%. Consider shortlisting more candidates to improve conversion.`
                    : `Great work! Your ${conversionRate}% offer rate shows strong candidate selection. Keep it up!`}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
