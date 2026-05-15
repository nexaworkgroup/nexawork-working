import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Sparkles, CheckCircle } from 'lucide-react'

const STEPS = ['Job Details', 'Description', 'Requirements', 'Salary & Location']

export default function PostJobPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [improving, setImproving] = useState(false)
  const [form, setForm] = useState({
    title: '', job_type: 'full_time', experience_level: 'any',
    description: '', requirements: '', location: '', is_remote: false,
    salary_min: '', salary_max: '', salary_currency: 'XAF', tags: [] as string[]
  })

  const up = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleImprove = async () => {
    if (!form.description) return
    setImproving(true)
    try {
      const res = await api.post('/ai/improve-job', {
        title: form.title, description: form.description, requirements: form.requirements
      })
      up('description', res.data.improved_description)
      up('requirements', res.data.improved_requirements)
      if (res.data.tags?.length) up('tags', res.data.tags)
    } catch {}
    setImproving(false)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.post('/jobs', {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      })
      navigate('/employer/dashboard')
    } catch (e: any) {
      alert(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Post a New Job</h1>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <div className={`h-1.5 rounded-full mb-1.5 transition-all ${i <= step ? 'bg-brand-green' : 'bg-gray-200'}`} />
            <p className={`text-xs ${i === step ? 'text-brand-green font-medium' : 'text-gray-400'}`}>{s}</p>
          </div>
        ))}
      </div>

      <div className="card">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 mb-4">Job Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title *</label>
              <input value={form.title} onChange={e => up('title', e.target.value)} className="input-field" placeholder="Senior Software Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Type</label>
                <select value={form.job_type} onChange={e => up('job_type', e.target.value)} className="input-field">
                  {['full_time','part_time','internship','contract','graduate_scheme'].map(t => (
                    <option key={t} value={t}>{t.replace('_',' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience Level</label>
                <select value={form.experience_level} onChange={e => up('experience_level', e.target.value)} className="input-field">
                  {['any','entry','mid','senior','executive'].map(l => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Job Description</h2>
              <button onClick={handleImprove} disabled={improving || !form.description}
                className="flex items-center gap-1.5 text-sm text-brand-green font-medium hover:underline disabled:opacity-40">
                <Sparkles size={14} /> {improving ? 'Improving…' : 'AI Improve'}
              </button>
            </div>
            <textarea value={form.description} onChange={e => up('description', e.target.value)}
              rows={8} className="input-field resize-none"
              placeholder="Describe the role, responsibilities, and what the candidate will be doing..." />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Requirements</h2>
            <textarea value={form.requirements} onChange={e => up('requirements', e.target.value)}
              rows={8} className="input-field resize-none"
              placeholder="List the skills, qualifications, and experience required..." />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 mb-4">Salary & Location</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input value={form.location} onChange={e => up('location', e.target.value)} className="input-field" placeholder="Douala, Cameroon" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_remote} onChange={e => up('is_remote', e.target.checked)} className="w-4 h-4 accent-brand-green" />
              <span className="text-sm font-medium text-gray-700">Remote-friendly position</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Salary</label>
                <input type="number" value={form.salary_min} onChange={e => up('salary_min', e.target.value)} className="input-field" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Salary</label>
                <input type="number" value={form.salary_max} onChange={e => up('salary_max', e.target.value)} className="input-field" placeholder="150000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                <select value={form.salary_currency} onChange={e => up('salary_currency', e.target.value)} className="input-field">
                  {['XAF','USD','EUR','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">← Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.title} className="btn-primary flex-1">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-gold flex-1 flex items-center justify-center gap-2">
              <CheckCircle size={18} />
              {loading ? 'Publishing…' : 'Publish Job'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
