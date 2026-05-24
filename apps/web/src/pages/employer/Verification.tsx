import { useState } from 'react'
import { Shield, CheckCircle, Upload, Building2, Globe, FileText, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/Toast'
import { clsx } from 'clsx'

const STEPS = [
  { id: 'company',   title: 'Company Details',    icon: Building2 },
  { id: 'docs',      title: 'Documents',           icon: FileText },
  { id: 'review',    title: 'Submit for Review',   icon: Shield },
]

export default function EmployerVerificationPage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useAuthStore()
  const { success, error: toastError } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company_name:    (profile as any)?.company_name || '',
    registration_no: '',
    website:         (profile as any)?.website || '',
    industry:        (profile as any)?.industry || '',
    company_size:    (profile as any)?.company_size || '',
    description:     (profile as any)?.description || '',
    contact_name:    '',
    contact_email:   '',
    contact_phone:   '',
  })

  const isVerified = (profile as any)?.is_verified

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.post('/employer/verification-request', form)
      success('Verification request submitted! We\'ll review within 2-3 business days.')
      navigate('/employer/dashboard')
    } catch (e: any) {
      toastError(e.message || 'Failed to submit. Please try again.')
    }
    setLoading(false)
  }

  if (isVerified) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="card text-center py-12">
          <div className="w-20 h-20 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={36} className="text-brand-green" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Verified! ✅</h2>
          <p className="text-gray-500 mb-6">Your company has been verified by NexaWork. The verified badge appears on all your job postings, increasing candidate trust and applications.</p>
          <div className="inline-flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-full text-sm font-semibold">
            <CheckCircle size={16} /> Verified Employer
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield size={22} className="text-brand-green" /> Get Verified
        </h1>
        <p className="text-gray-400 text-sm mt-1">Verified employers get 3x more applicants and a trust badge on all job postings</p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: '🎯', label: '3x more applications' },
          { icon: '✅', label: 'Trust badge on jobs' },
          { icon: '🔝', label: 'Priority in search' },
        ].map(({ icon, label }) => (
          <div key={label} className="card text-center py-4">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-xs font-medium text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1">
            <div className={clsx('h-1.5 rounded-full transition-all', i <= step ? 'bg-brand-green' : 'bg-gray-200')} />
            <p className={clsx('text-xs mt-1 text-center', i === step ? 'text-brand-green font-medium' : 'text-gray-400')}>{s.title}</p>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Step 1 — Company Details */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 mb-4">Company Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
              <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                className="input-field" placeholder="Acme Corp Ltd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number *</label>
              <input value={form.registration_no} onChange={e => setForm(p => ({ ...p, registration_no: e.target.value }))}
                className="input-field" placeholder="RC/DLA/2020/B/12345" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                <input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                  className="input-field" placeholder="Technology" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
                <select value={form.company_size} onChange={e => setForm(p => ({ ...p, company_size: e.target.value }))} className="input-field">
                  <option value="">Select</option>
                  {['1-10','11-50','51-200','201-1000','1000+'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1"><Globe size={13} />Website</span>
              </label>
              <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                className="input-field" placeholder="https://yourcompany.com" />
            </div>
          </div>
        )}

        {/* Step 2 — Contact */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Person</h2>
            <p className="text-sm text-gray-400">We'll use this to verify your company and follow up if needed.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
                className="input-field" placeholder="Jean-Paul Mbah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Email *</label>
              <input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                className="input-field" placeholder="hr@yourcompany.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))}
                className="input-field" placeholder="+237 6XX XXX XXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={4} className="input-field resize-none"
                placeholder="Brief description of your company, what you do, and your culture..." />
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Review & Submit</h2>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Company',        value: form.company_name },
                { label: 'Reg. Number',    value: form.registration_no },
                { label: 'Industry',       value: form.industry },
                { label: 'Contact',        value: form.contact_name },
                { label: 'Contact Email',  value: form.contact_email },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <p className="text-sm text-gray-400 w-32 flex-shrink-0">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
                </div>
              ))}
            </div>
            <div className="bg-brand-green-light border border-brand-green/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-brand-green font-medium">✅ What happens next:</p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Our team reviews your submission within 2-3 business days</li>
                <li>You'll receive an email when verified</li>
                <li>Verified badge appears on all your job postings immediately</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">Back</button>}
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && (!form.company_name || !form.registration_no)}
              className="btn-primary flex-1">
              Continue
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</> : <><Shield size={16} />Submit for Verification</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
