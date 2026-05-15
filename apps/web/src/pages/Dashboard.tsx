import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Zap, AlertCircle, TrendingUp, FileText, MessageSquare, Bookmark, FilePlus2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import JobCard, { Job } from '../components/jobs/JobCard'
import ApplyModal from '../components/jobs/ApplyModal'
import { JobCardSkeletonGrid } from '../components/ui/Skeleton'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const name = (profile as any)?.full_name?.split(' ')[0] || ''
  const strength = (profile as any)?.profile_strength || 0

  const { data, isLoading } = useQuery({
    queryKey: ['feed', page],
    queryFn: () => api.get(`/seeker/feed?page=${page}`).then(r => r.data)
  })

  const { data: appsData } = useQuery({
    queryKey: ['applications-count'],
    queryFn: () => api.get('/seeker/applications').then(r => r.data)
  })

  const jobs: Job[] = data?.jobs || []
  const appCount = appsData?.applications?.length || 0

  const quickActions = [
    { icon: Zap,      label: 'AI Matches',    value: jobs.length || '—',  color: 'text-brand-green bg-brand-green-light', onClick: undefined },
    { icon: FileText, label: 'Applications',  value: appCount,             color: 'text-blue-600 bg-blue-50',              onClick: () => navigate('/applications') },
    { icon: TrendingUp, label: 'Profile',     value: `${strength}%`,       color: 'text-brand-gold-dark bg-brand-gold-light', onClick: () => navigate('/profile') },
    { icon: FilePlus2, label: 'Build CV',     value: 'AI',                 color: 'text-purple-600 bg-purple-50',          onClick: () => navigate('/cv-builder') },
    { icon: Bookmark, label: 'Saved Jobs',    value: '→',                  color: 'text-pink-600 bg-pink-50',              onClick: () => navigate('/saved') },
    { icon: MessageSquare, label: 'AI Chat',  value: '→',                  color: 'text-indigo-600 bg-indigo-50',          onClick: () => navigate('/chat') },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {name ? `Welcome back, ${name} 👋` : 'Welcome to NexaWork 🎉'}
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Your personalised job feed — updated every 6 hours</p>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {quickActions.map(({ icon: Icon, label, value, color, onClick }) => (
          <button key={label} onClick={onClick}
            className={`card flex flex-col items-center text-center py-4 gap-2 transition-all ${onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-95' : 'cursor-default'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </button>
        ))}
      </div>

      {/* Profile strength warning */}
      {strength < 60 && (
        <div className="mb-6 p-4 bg-brand-gold-light border border-brand-gold/30 rounded-xl flex items-start gap-3">
          <AlertCircle size={18} className="text-brand-gold-dark flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Complete your profile for better AI matches</p>
            <p className="text-xs text-gray-500 mt-0.5">Profile strength: {strength}% — add education, bio and skills</p>
          </div>
          <button onClick={() => navigate('/profile')} className="text-xs font-medium text-brand-green hover:underline flex-shrink-0">
            Improve →
          </button>
        </div>
      )}

      {/* Match feed header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-brand-gold" />
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.your_matches')}</h2>
          {data?.has_embedding && <span className="badge badge-green text-xs">AI Powered</span>}
        </div>
        <button onClick={() => navigate('/jobs')} className="text-sm text-brand-green font-medium hover:underline">
          Browse All →
        </button>
      </div>

      {/* Feed */}
      {isLoading ? (
        <JobCardSkeletonGrid count={6} />
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16">
          <Zap size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-600">{t('dashboard.no_embedding')}</p>
          <p className="text-sm text-gray-400 mt-1">Add your skills and education to unlock AI matching</p>
          <button onClick={() => navigate('/profile')} className="btn-primary mt-4 text-sm px-6">
            Complete Profile
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} onApply={setApplyJob} />)}
          </div>
          <div className="flex justify-center gap-3 mt-8">
            {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-secondary px-6 py-2">← Previous</button>}
            {jobs.length === 20 && <button onClick={() => setPage(p => p + 1)} className="btn-primary px-6 py-2">Next →</button>}
          </div>
        </>
      )}

      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  )
}
