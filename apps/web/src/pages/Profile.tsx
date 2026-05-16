import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { User, Building2, CheckCircle, Globe, Users, Target } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/Toast'
import FileUpload from '../components/FileUpload'

export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, setProfile, user } = useAuthStore()
  const { success, error: toastError } = useToast()
  const isEmployer = user?.role === 'employer'
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then(r => r.data),
    enabled: !isEmployer
  })

  const skills = skillsData?.skills || []
  const grouped = skills.reduce((acc: any, s: any) => {
    acc[s.category] = [...(acc[s.category] || []), s]
    return acc
  }, {})

  useEffect(() => {
    if (profile) {
      setForm({ ...profile })
      const existing = (profile as any)?.seeker_skills?.map((s: any) => s.skill_id).filter(Boolean) || []
      setSelectedSkills(existing)
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isEmployer) {
        const res = await api.put('/employer/profile', form)
        setProfile(res.data.profile)
      } else {
        const res = await api.put('/seeker/profile', { ...form, skill_ids: selectedSkills })
        setProfile(res.data.profile)
      }
      success('Profile saved!')
    } catch (e: any) {
      toastError(e.message || 'Failed to save profile')
    }
    setSaving(false)
  }

  const toggleSkill = (id: string) =>
    setSelectedSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const strength = (profile as any)?.profile_strength || 0

  // ── EMPLOYER ──────────────────────────────────────
  if (isEmployer) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
            <p className="text-gray-400 text-sm mt-0.5">How candidates see your company</p>
          </div>
        </div>

        {/* Company header */}
        <div className="card mb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-brand-green-light flex items-center justify-center text-brand-green text-2xl font-bold flex-shrink-0">
            {(form.company_name || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{form.company_name || 'Your Company'}</p>
            <p className="text-sm text-gray-400">{form.industry || 'Industry not set'} · {form.location || 'Location not set'}</p>
            {form.is_verified && <span className="badge badge-green text-xs mt-1">✓ Verified Employer</span>}
          </div>
        </div>

        <div className="card mb-4">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-brand-green" /> Company Information
          </h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name *</label>
              <input value={form.company_name || ''} onChange={e => setForm((p: any) => ({ ...p, company_name: e.target.value }))} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
                <input value={form.industry || ''} onChange={e => setForm((p: any) => ({ ...p, industry: e.target.value }))} className="input-field" placeholder="Technology" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
                <select value={form.company_size || ''} onChange={e => setForm((p: any) => ({ ...p, company_size: e.target.value }))} className="input-field">
                  <option value="">Select size</option>
                  {['1-10','11-50','51-200','201-1000','1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input value={form.location || ''} onChange={e => setForm((p: any) => ({ ...p, location: e.target.value }))} className="input-field" placeholder="Douala, Cameroun" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1"><Globe size={14} /> Website</span>
              </label>
              <input value={form.website || ''} onChange={e => setForm((p: any) => ({ ...p, website: e.target.value }))} className="input-field" placeholder="https://yourcompany.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Description</label>
              <textarea value={form.description || ''} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                rows={4} className="input-field resize-none" placeholder="Describe your company, culture, and what makes it a great place to work..." />
            </div>
          </div>
        </div>

        <div className="card mb-6 bg-brand-green-light border-brand-green/20">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-brand-green" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Hiring on NexaWork</p>
              <p className="text-xs text-gray-500">Your job postings reach thousands of African graduates</p>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-base">
          {saving ? 'Saving…' : 'Save Company Profile'}
        </button>
      </div>
    )
  }

  // ── JOB SEEKER ────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>
          <p className="text-gray-400 text-sm mt-0.5">How employers see you</p>
        </div>
      </div>

      {/* Profile strength */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Strength</span>
          <span className="text-sm font-bold text-brand-green">{strength}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-green to-brand-gold rounded-full transition-all duration-700"
            style={{ width: `${strength}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {strength < 40 ? '⚡ Add education and skills to improve your matches'
            : strength < 70 ? '🚀 Almost there — add a bio and more skills'
            : '✅ Great profile! You\'re getting the best matches'}
        </p>
      </div>

      {/* Photo + basic info */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={18} className="text-brand-green" /> Personal Information
        </h2>

        {/* Avatar upload */}
        <div className="mb-5">
          <FileUpload
            type="avatar"
            currentUrl={(profile as any)?.avatar_url}
            onUpload={url => {
              setForm((p: any) => ({ ...p, avatar_url: url }))
              api.put('/seeker/profile', { ...form, avatar_url: url }).catch(() => {})
            }}
          />
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.full_name')} *</label>
            <input value={form.full_name || ''} onChange={e => setForm((p: any) => ({ ...p, full_name: e.target.value }))} className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.location')}</label>
            <input value={form.location || ''} onChange={e => setForm((p: any) => ({ ...p, location: e.target.value }))} className="input-field" placeholder="Douala, Cameroun" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea value={form.bio || ''} onChange={e => setForm((p: any) => ({ ...p, bio: e.target.value }))}
              rows={3} className="input-field resize-none" placeholder="Tell employers about yourself and your goals..." />
          </div>
          {/* Open to Work toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-brand-green transition-colors">
            <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_open_to_work ? 'bg-brand-green' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_open_to_work ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={form.is_open_to_work || false}
              onChange={e => setForm((p: any) => ({ ...p, is_open_to_work: e.target.checked }))} />
            <div>
              <p className="text-sm font-medium text-gray-900">Open to Work</p>
              <p className="text-xs text-gray-400">Let employers know you're actively looking for opportunities</p>
            </div>
            {form.is_open_to_work && (
              <span className="ml-auto badge badge-green text-xs flex-shrink-0">🟢 Active</span>
            )}
          </label>
        </div>
      </div>

      {/* Education */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">🎓 Education</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.degree')}</label>
            <input value={form.degree || ''} onChange={e => setForm((p: any) => ({ ...p, degree: e.target.value }))} className="input-field" placeholder="BSc, MSc, HND..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.field')}</label>
            <input value={form.field_of_study || ''} onChange={e => setForm((p: any) => ({ ...p, field_of_study: e.target.value }))} className="input-field" placeholder="Computer Science..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.institution')}</label>
            <input value={form.institution || ''} onChange={e => setForm((p: any) => ({ ...p, institution: e.target.value }))} className="input-field" placeholder="University of Buea" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.grad_year')}</label>
            <input type="number" value={form.graduation_year || ''} onChange={e => setForm((p: any) => ({ ...p, graduation_year: parseInt(e.target.value) }))}
              className="input-field" placeholder="2024" min="1990" max="2030" />
          </div>
        </div>
      </div>

      {/* CV Upload */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-1">📄 Your CV</h2>
        <p className="text-xs text-gray-400 mb-4">
          Upload your CV here — when you apply to jobs, employers will be able to download it.
          You can also use our AI CV Builder to create one from scratch.
        </p>
        <FileUpload
          type="cv"
          currentUrl={(profile as any)?.cv_url}
          onUpload={url => {
            setForm((p: any) => ({ ...p, cv_url: url }))
            api.put('/seeker/profile', { ...form, cv_url: url }).catch(() => {})
          }}
        />
        {(form.cv_url || (profile as any)?.cv_url) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-green">
            <CheckCircle size={14} />
            <span>CV uploaded — employers can download it when you apply</span>
            <a href={form.cv_url || (profile as any)?.cv_url} target="_blank" rel="noopener noreferrer"
              className="underline ml-auto">View CV</a>
          </div>
        )}
        <button onClick={() => navigate('/cv-builder')}
          className="btn-secondary w-full mt-3 text-sm py-2 flex items-center justify-center gap-2">
          ✨ Or build a new CV with AI
        </button>
      </div>

      {/* Skills */}
      {Object.keys(grouped).length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-900 mb-1">⚡ Skills</h2>
          <p className="text-xs text-gray-400 mb-4">Select skills to power your AI job matching</p>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
            {Object.entries(grouped).map(([cat, catSkills]: any) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((skill: any) => (
                    <button key={skill.id} onClick={() => toggleSkill(skill.id)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        selectedSkills.includes(skill.id)
                          ? 'bg-brand-green text-white border-brand-green'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-green'
                      }`}>
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill gap link */}
      <button onClick={() => navigate('/skill-gap')}
        className="btn-secondary w-full py-2.5 mb-3 flex items-center justify-center gap-2 text-sm">
        <Target size={16} /> View Skill Gap Advisor
      </button>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-base">
        {saving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  )
}
