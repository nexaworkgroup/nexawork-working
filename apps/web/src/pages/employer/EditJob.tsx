import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'

export default function EditJobPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [form, setForm] = useState<any>({})

  const { data, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.get(`/jobs/${jobId}`).then(r => r.data)
  })

  useEffect(() => {
    if (data?.job) setForm(data.job)
  }, [data])

  const up = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/jobs/${jobId}`, form)
      success('Job updated successfully')
      navigate('/employer/dashboard')
    } catch (e: any) {
      toastError(e.message || 'Failed to update job')
    }
    setSaving(false)
  }

  const handleClose = async () => {
    if (!confirm('Close this job posting? It will no longer appear in search results.')) return
    setClosing(true)
    try {
      await api.delete(`/jobs/${jobId}`)
      success('Job posting closed')
      navigate('/employer/dashboard')
    } catch (e: any) {
      toastError(e.message || 'Failed to close job')
    }
    setClosing(false)
  }

  if (isLoading) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Job Posting</h1>
          <p className="text-gray-400 text-sm mt-0.5">{form.title}</p>
        </div>
        <button onClick={handleClose} disabled={closing}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-4 py-2 rounded-lg transition-all">
          <Trash2 size={15} />
          {closing ? 'Closing…' : 'Close Job'}
        </button>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
          <input value={form.title || ''} onChange={e => up('title', e.target.value)} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Type</label>
            <select value={form.job_type || ''} onChange={e => up('job_type', e.target.value)} className="input-field">
              {['full_time','part_time','internship','contract','graduate_scheme'].map(t => (
                <option key={t} value={t}>{t.replace('_',' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience Level</label>
            <select value={form.experience_level || ''} onChange={e => up('experience_level', e.target.value)} className="input-field">
              {['any','entry','mid','senior','executive'].map(l => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
          <input value={form.location || ''} onChange={e => up('location', e.target.value)} className="input-field" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_remote || false} onChange={e => up('is_remote', e.target.checked)} className="w-4 h-4 accent-brand-green" />
          <span className="text-sm font-medium text-gray-700">Remote-friendly</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={form.description || ''} onChange={e => up('description', e.target.value)}
            rows={6} className="input-field resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Requirements</label>
          <textarea value={form.requirements || ''} onChange={e => up('requirements', e.target.value)}
            rows={4} className="input-field resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Salary</label>
            <input type="number" value={form.salary_min || ''} onChange={e => up('salary_min', parseInt(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Salary</label>
            <input type="number" value={form.salary_max || ''} onChange={e => up('salary_max', parseInt(e.target.value))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <select value={form.salary_currency || 'XAF'} onChange={e => up('salary_currency', e.target.value)} className="input-field">
              {['XAF','USD','EUR','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <CheckCircle size={18} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
