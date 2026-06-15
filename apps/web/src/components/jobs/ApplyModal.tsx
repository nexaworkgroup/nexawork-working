import { useState } from 'react'
import { X, Send, CheckCircle, AlertCircle, Share2 } from 'lucide-react'
import { api } from '../../lib/api'
import { Job } from './JobCard'
import { useToast } from '../Toast'

interface Props { job: Job; onClose: () => void }

export default function ApplyModal({ job, onClose }: Props) {
  const { success, error: toastError } = useToast()
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    setLoading(true); setError('')
    try {
      if (job.source !== 'native' && job.external_url) {
        window.open(job.external_url, '_blank', 'noopener,noreferrer')
      }
      await api.post('/applications', { job_id: job.id, cover_letter: coverLetter || null })
      success('Application submitted! 🎉')
      setDone(true)
    } catch (e: any) {
      const msg = e.message?.includes('Already applied') ? 'You already applied to this job' : e.message || 'Failed to apply'
      setError(msg)
      toastError(msg)
    }
    setLoading(false)
  }

  const handleShare = () => {
    const text = `🚀 Job Opportunity: ${job.title} at ${job.company_name}${job.location ? ` — ${job.location}` : ''}\n\nApply on NexaWork 👇\n${window.location.origin}/jobs/${job.id}`
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(wa, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] rounded-2xl w-full max-w-md shadow-2xl">
        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-brand-green" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted! 🎉</h3>
            <p className="text-gray-500 mb-4 text-sm">
              {job.source !== 'native'
                ? "We've recorded your application and opened the original posting."
                : "Your application has been sent. Track it in Applications."}
            </p>
            <button onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 rounded-xl border border-green-500 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors">
              <Share2 size={16} /> Share on WhatsApp
            </button>
            <button onClick={onClose} className="btn-primary w-full py-2.5">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green font-bold">
                  {job.company_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                  <p className="text-xs text-gray-400">{job.company_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-green-600 transition-colors" title="Share on WhatsApp">
                  <Share2 size={16} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {job.source !== 'native' && (
                <div className="mb-4 p-3 bg-brand-gold-light border border-brand-gold/30 rounded-lg">
                  <p className="text-xs text-brand-gold-dark">
                    ⚡ From <strong>{job.source.replace('scraped_','').replace('jsearch','LinkedIn/Indeed')}</strong> — clicking Apply opens the original posting.
                  </p>
                </div>
              )}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                rows={4} placeholder="Tell the employer why you're a great fit..."
                className="input-field resize-none text-sm" />
              <p className="text-xs text-gray-400 mt-2">Your profile and skills are shared automatically.</p>
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button onClick={handleApply} disabled={loading} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Applying…</> : <><Send size={15} />Apply Now</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
