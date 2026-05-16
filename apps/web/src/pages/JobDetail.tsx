import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Wifi, ExternalLink, ArrowLeft, Zap, Share2, BookmarkPlus, BookmarkCheck, Building2, Briefcase } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import ApplyModal from '../components/jobs/ApplyModal'
import SimilarJobs from '../components/jobs/SimilarJobs'
import { useToast } from '../components/Toast'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success } = useToast()
  const [applyOpen, setApplyOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data)
  })

  const job = data?.job

  const handleSave = async () => {
    if (!user) { navigate('/register'); return }
    try {
      if (saved) {
        await api.delete(`/seeker/saved-jobs/${id}`)
        setSaved(false)
      } else {
        await api.post(`/seeker/saved-jobs/${id}`, {})
        setSaved(true)
        success('Job saved!')
      }
    } catch {}
  }

  const handleShare = () => {
    const text = `🚀 ${job.title} at ${job.company_name}${job.location ? ` — ${job.location}` : ''}\n\nApply on NexaWork 👇\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">Job not found</p>
        <button onClick={() => navigate('/jobs')} className="btn-primary mt-4 text-sm px-5">Browse Jobs</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Main card */}
        <div className="card mb-4">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green font-bold text-xl flex-shrink-0">
              {job.company_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{job.title}</h1>
              <p className="text-gray-500 mt-0.5 flex items-center gap-1">
                <Building2 size={14} /> {job.company_name}
              </p>
            </div>
            {/* Share + Save */}
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Share on WhatsApp">
                <Share2 size={18} />
              </button>
              {user?.role === 'job_seeker' && (
                <button onClick={handleSave}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={saved ? 'Unsave' : 'Save job'}>
                  {saved
                    ? <BookmarkCheck size={18} className="text-brand-green" />
                    : <BookmarkPlus size={18} className="text-gray-400" />}
                </button>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 mb-4">
            {job.job_type && (
              <span className="badge badge-gold text-xs capitalize">{job.job_type.replace('_', ' ')}</span>
            )}
            {job.is_remote && (
              <span className="badge badge-green text-xs flex items-center gap-1"><Wifi size={11} />Remote</span>
            )}
            {job.experience_level && job.experience_level !== 'any' && (
              <span className="badge badge-gray text-xs capitalize">{job.experience_level} level</span>
            )}
            {job.source && job.source !== 'native' && (
              <span className="badge bg-gray-50 text-gray-400 text-xs capitalize">
                via {job.source.replace('scraped_', '').replace('jsearch', 'LinkedIn/Indeed')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
            {job.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>}
            <span className="flex items-center gap-1.5"><Clock size={14} />Posted {new Date(job.posted_at).toLocaleDateString()}</span>
            {job.match_score > 0 && (
              <span className="flex items-center gap-1.5 text-brand-green font-medium">
                <Zap size={14} />{job.match_score}% match
              </span>
            )}
          </div>

          {/* Salary */}
          {(job.salary_min || job.salary_max) && (
            <div className="bg-brand-green-light rounded-xl px-4 py-3 mb-5">
              <p className="text-sm font-semibold text-brand-green">
                💰 {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()} {job.salary_currency}/month
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3">
            {user ? (
              user.role === 'job_seeker' ? (
                <button onClick={() => setApplyOpen(true)} className="btn-primary flex-1 py-3 text-base">
                  Apply Now
                </button>
              ) : (
                <p className="text-sm text-gray-400 italic">Log in as a job seeker to apply</p>
              )
            ) : (
              <button onClick={() => navigate('/register')} className="btn-primary flex-1 py-3 text-base">
                Sign Up to Apply
              </button>
            )}
            {job.external_url && (
              <a href={job.external_url} target="_blank" rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2 text-sm">
                <ExternalLink size={15} /> Original
              </a>
            )}
            <button onClick={handleShare}
              className="btn-secondary flex items-center gap-2 text-sm text-green-600 border-green-200 hover:bg-green-50">
              <Share2 size={15} /> WhatsApp
            </button>
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="card mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">About This Role</h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</div>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className="card mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Requirements</h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</div>
          </div>
        )}

        {/* Tags */}
        {job.tags?.length > 0 && (
          <div className="card mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag: string) => (
                <span key={tag} className="badge badge-gray text-xs">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Similar jobs */}
        <SimilarJobs jobId={id!} title={job.title} />

        {/* Not logged in CTA */}
        {!user && (
          <div className="card mt-4 bg-brand-green text-white text-center py-8">
            <p className="font-bold text-lg mb-2">Ready to apply?</p>
            <p className="text-green-200 text-sm mb-4">Create a free account and let AI find your perfect job</p>
            <button onClick={() => navigate('/register')} className="bg-brand-gold text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Get Started — It's Free
            </button>
          </div>
        )}
      </div>

      {applyOpen && job && <ApplyModal job={job} onClose={() => setApplyOpen(false)} />}
    </div>
  )
}
