import { useState } from 'react'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { Job } from './JobCard'

interface Props {
  job: Job
  onClose: () => void
}

export default function ApplyModal({ job, onClose }: Props) {
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    setLoading(true)
    setError('')
    try {
      // For external jobs — open original posting + record in DB
      if (job.source !== 'native' && job.external_url) {
        window.open(job.external_url, '_blank', 'noopener,noreferrer')
      }
      // Always record the application
      await api.post('/applications', {
        job_id: job.id,
        cover_letter: coverLetter || null
      })
      setDone(true)
    } catch (e: any) {
      const msg = e.message || 'Failed to apply'
      if (msg.includes('Already applied')) {
        setError('You have already applied to this job.')
      } else {
        setError(msg)
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4">
        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-brand-green" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted! 🎉</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              {job.source !== 'native'
                ? "We've recorded your application and opened the original job posting in a new tab."
                : "Your application has been sent to the employer. You can track it in Applications."}
            </p>
            <button onClick={onClose} className="btn-primary w-full py-3">Done</button>
          </div>
        ) : (
          <>
            {/* Header */}
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
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
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
                    ⚡ This job is from <strong>{job.source.replace('scraped_', '').replace('jsearch', 'LinkedIn/Indeed')}</strong>.
                    Clicking Apply will open the original posting in a new tab.
                  </p>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                rows={4}
                placeholder="Tell the employer why you're a great fit for this role..."
                className="input-field resize-none text-sm"
              />
              <p className="text-xs text-gray-400 mt-2">
                Your profile, skills, and education will be shared with the employer automatically.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={onClose} className="btn-secondary flex-1 py-2.5">
                Cancel
              </button>
              <button onClick={handleApply} disabled={loading}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Apply Now
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
