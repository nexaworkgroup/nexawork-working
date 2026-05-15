import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Wifi, ExternalLink, ArrowLeft, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import ApplyModal from '../components/jobs/ApplyModal'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [applyOpen, setApplyOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data)
  })

  const job = data?.job

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!job) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Job not found.</div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="card mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green font-bold text-xl">
              {job.company_name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-500">{job.company_name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-5">
            {job.location && <span className="flex items-center gap-1"><MapPin size={15}/>{job.location}</span>}
            {job.is_remote && <span className="flex items-center gap-1 text-brand-green"><Wifi size={15}/>Remote</span>}
            <span className="flex items-center gap-1"><Clock size={15}/>{new Date(job.posted_at).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {job.job_type && <span className="badge badge-gold">{job.job_type.replace('_',' ')}</span>}
            {job.experience_level && job.experience_level !== 'any' && <span className="badge badge-gray">{job.experience_level}</span>}
          </div>

          {(job.salary_min || job.salary_max) && (
            <div className="bg-brand-green-light rounded-lg px-4 py-3 mb-6">
              <p className="text-sm font-semibold text-brand-green">
                Salary: {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()} {job.salary_currency}/month
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {user ? (
              <button onClick={() => setApplyOpen(true)} className="btn-primary flex-1 py-3 text-base">Apply Now</button>
            ) : (
              <button onClick={() => navigate('/register')} className="btn-primary flex-1 py-3 text-base">Sign Up to Apply</button>
            )}
            {job.external_url && (
              <a href={job.external_url} target="_blank" rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2">
                <ExternalLink size={16}/> Original Posting
              </a>
            )}
          </div>
        </div>

        {job.description && (
          <div className="card mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Job Description</h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</div>
          </div>
        )}

        {job.requirements && (
          <div className="card mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Requirements</h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</div>
          </div>
        )}
      </div>

      {applyOpen && job && <ApplyModal job={job} onClose={() => setApplyOpen(false)} />}
    </div>
  )
}
