import { useState } from 'react'
import { MapPin, Clock, BookmarkPlus, BookmarkCheck, Zap, Share2 } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

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
  onSaveToggle?: (jobId: string, saved: boolean) => void
  compact?: boolean
}

export default function JobCard({ job, onApply, onSaveToggle, compact }: JobCardProps) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [savingState, setSavingState] = useState(false)

  const score = job.match_score
  const scoreColor = score && score >= 75
    ? 'bg-brand-green text-white'
    : score && score >= 50
    ? 'bg-brand-gold-light text-brand-gold-dark'
    : 'bg-[var(--border-soft)] text-gray-500'

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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `🚀 ${job.title} at ${job.company_name}${job.location ? ` — ${job.location}` : ''}\n\nApply on NexaWork 👇\n${window.location.origin}/jobs/${job.id}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const postedDate = new Date(job.posted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className={clsx('card hover:shadow-card-hover transition-all duration-200 cursor-pointer group', compact && 'p-4')}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center flex-shrink-0 text-brand-green font-bold text-sm">
          {job.company_name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-brand-green transition-colors">
            {job.title}
          </h3>
          <p className="text-xs text-gray-500 truncate">{job.company_name}</p>
        </div>
        {score !== undefined && score > 0 && (
          <div className={clsx('flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0', scoreColor)}>
            <Zap size={10} />{score}%
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.job_type && (
          <span className="badge badge-gold text-xs capitalize">{job.job_type.replace('_', ' ')}</span>
        )}
        {job.is_remote && <span className="badge badge-green text-xs">Remote</span>}
        {job.experience_level && job.experience_level !== 'any' && (
          <span className="badge badge-gray text-xs capitalize">{job.experience_level}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
        {job.location && <span className="flex items-center gap-1 truncate"><MapPin size={11} />{job.location}</span>}
        <span className="flex items-center gap-1 flex-shrink-0"><Clock size={11} />{postedDate}</span>
      </div>

      {(job.salary_min || job.salary_max) && (
        <p className="text-xs font-semibold text-brand-green mb-3">
          {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()} {job.salary_currency}
        </p>
      )}

      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button onClick={() => onApply?.(job)} className="btn-primary flex-1 text-sm py-2">
          Apply Now
        </button>
        {/* WhatsApp share */}
        <button onClick={handleShare}
          className="p-2 rounded-lg border border-gray-200 hover:border-green-400 hover:text-green-600 text-gray-400 transition-all" title="Share on WhatsApp">
          <Share2 size={16} />
        </button>
        {/* Save */}
        {user?.role === 'job_seeker' && (
          <button onClick={handleSave} disabled={savingState}
            className="p-2 rounded-lg border border-gray-200 hover:border-brand-green hover:text-brand-green text-gray-400 transition-all">
            {saved ? <BookmarkCheck size={16} className="text-brand-green" /> : <BookmarkPlus size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}
