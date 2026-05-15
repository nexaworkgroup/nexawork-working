import { useState } from 'react'
import { MapPin, Clock, Wifi, BookmarkPlus, BookmarkCheck, ExternalLink, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export interface Job {
  id: string
  title: string
  company_name: string
  location: string | null
  is_remote: boolean
  job_type: string | null
  experience_level: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  tags: string[]
  posted_at: string
  source: string
  external_url: string | null
  match_score?: number
}

export interface JobCardProps {
  job: Job
  onApply?: (job: Job) => void
  isSaved?: boolean
  onSaveToggle?: (jobId: string, saved: boolean) => void
  compact?: boolean
}

const JOB_TYPE_COLOURS: Record<string, string> = {
  internship: 'badge-gold',
  graduate_scheme: 'badge-green',
  full_time: 'badge-gray',
  part_time: 'badge-gray',
  contract: 'badge-gray',
}

export default function JobCard({ job, onApply, isSaved = false, onSaveToggle, compact }: JobCardProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(isSaved)
  const [savingState, setSavingState] = useState(false)

  const score = job.match_score
  const scoreColor = score && score >= 75
    ? 'bg-brand-green text-white'
    : score && score >= 50
    ? 'bg-brand-gold-light text-brand-gold-dark'
    : 'bg-gray-100 text-gray-500'

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    setSavingState(true)
    try {
      if (saved) {
        await api.delete(`/seeker/saved-jobs/${job.id}`)
      } else {
        await api.post(`/seeker/saved-jobs/${job.id}`, {})
      }
      setSaved(!saved)
      onSaveToggle?.(job.id, !saved)
    } catch {}
    setSavingState(false)
  }

  const postedDate = new Date(job.posted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div className={clsx(
      'card hover:shadow-card-hover transition-all duration-200 cursor-pointer group',
      compact && 'p-4'
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center flex-shrink-0 text-brand-green font-bold text-sm">
          {job.company_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-brand-green transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-gray-500 truncate">{job.company_name}</p>
        </div>
        {score !== undefined && score > 0 && (
          <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0', scoreColor)}>
            <Zap size={11} />
            {score}%
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.job_type && (
          <span className={clsx('badge text-xs', JOB_TYPE_COLOURS[job.job_type] || 'badge-gray')}>
            {t(`jobs.${job.job_type}` as any, job.job_type)}
          </span>
        )}
        {job.is_remote && <span className="badge badge-green">{t('jobs.remote')}</span>}
        {job.experience_level && job.experience_level !== 'any' && (
          <span className="badge badge-gray">{t(`jobs.${job.experience_level}` as any, job.experience_level)}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
        )}
        <span className="flex items-center gap-1"><Clock size={12} /> {postedDate}</span>
        {job.source !== 'native' && (
          <span className="flex items-center gap-1 ml-auto">
            <ExternalLink size={11} />
            <span className="capitalize">{job.source.replace('scraped_', '').replace('_', ' ')}</span>
          </span>
        )}
      </div>

      {(job.salary_min || job.salary_max) && (
        <p className="text-sm font-medium text-brand-green mb-4">
          {job.salary_min && job.salary_max
            ? `${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} ${job.salary_currency}`
            : job.salary_min
            ? `From ${job.salary_min.toLocaleString()} ${job.salary_currency}`
            : `Up to ${job.salary_max?.toLocaleString()} ${job.salary_currency}`}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={() => onApply?.(job)} className="btn-primary flex-1 text-sm py-2">
          {t('jobs.apply')}
        </button>
        {user?.role === 'job_seeker' && (
          <button
            onClick={handleSave}
            disabled={savingState}
            className="p-2 rounded-lg border border-gray-200 hover:border-brand-green hover:text-brand-green transition-all"
          >
            {saved
              ? <BookmarkCheck size={18} className="text-brand-green" />
              : <BookmarkPlus size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
