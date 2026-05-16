import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Clock, Video, Phone, MapPin, ArrowLeft, CheckCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'

const TYPES = [
  { value: 'video',     icon: Video,   label: 'Video Call',  placeholder: 'Paste Google Meet / Zoom link' },
  { value: 'phone',     icon: Phone,   label: 'Phone Call',  placeholder: 'Phone number' },
  { value: 'in_person', icon: MapPin,  label: 'In Person',   placeholder: 'Office address' },
]

const DURATIONS = [15, 30, 45, 60, 90]

export default function ScheduleInterviewPage() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    scheduled_at: '',
    duration_minutes: 30,
    type: 'video',
    location: '',
    notes: ''
  })

  const { data: appData } = useQuery({
    queryKey: ['application', appId],
    queryFn: async () => {
      // We'll get this from the candidates list
      return null
    },
    enabled: false
  })

  const selectedType = TYPES.find(t => t.value === form.type)!

  const handleSchedule = async () => {
    if (!form.scheduled_at) { toastError('Please select a date and time'); return }
    setLoading(true)
    try {
      await api.post('/employer/interviews', { ...form, application_id: appId })
      success('Interview scheduled! The candidate has been notified.')
      setDone(true)
    } catch (e: any) {
      toastError(e.message || 'Failed to schedule interview')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-brand-green" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Interview Scheduled! 🎉</h2>
          <p className="text-gray-500 text-sm mb-6">The candidate has been notified and will confirm their attendance.</p>
          <button onClick={() => navigate('/employer/applicants')} className="btn-primary px-8 py-2.5">
            Back to Applicants
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Interview</h1>
        <p className="text-gray-400 text-sm mt-0.5">The candidate will receive a notification with the details</p>
      </div>

      <div className="card space-y-5">
        {/* Interview type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(({ value, icon: Icon, label }) => (
              <button key={value} onClick={() => setForm(p => ({ ...p, type: value }))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  form.type === value
                    ? 'border-brand-green bg-brand-green-light text-brand-green'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date + time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Date & Time *</span>
          </label>
          <input type="datetime-local" value={form.scheduled_at}
            onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
            className="input-field" min={new Date().toISOString().slice(0, 16)} />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-1.5"><Clock size={14} /> Duration</span>
          </label>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setForm(p => ({ ...p, duration_minutes: d }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  form.duration_minutes === d
                    ? 'bg-brand-green text-white border-brand-green'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {d}min
              </button>
            ))}
          </div>
        </div>

        {/* Location / link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {selectedType.label} Details
          </label>
          <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
            className="input-field" placeholder={selectedType.placeholder} />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes for Candidate</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3} className="input-field resize-none"
            placeholder="What to prepare, what to bring, dress code, topics to cover..." />
        </div>

        <button onClick={handleSchedule} disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Scheduling…</>
            : <><Calendar size={18} />Schedule Interview</>}
        </button>
      </div>
    </div>
  )
}
