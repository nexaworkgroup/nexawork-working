import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Autocomplete, UNIVERSITIES, LOCATIONS, DEGREES, FIELDS_OF_STUDY, INDUSTRIES } from '../../components/ui/Autocomplete'

export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ full_name:'', location:'', degree:'', field_of_study:'', institution:'', graduation_year:'', bio:'' })
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [empForm, setEmpForm] = useState({ company_name:'', industry:'', company_size:'', location:'', website:'', description:'' })

  const isEmployer = user?.role === 'employer'
  const totalSteps = 3

  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then(r => r.data),
    enabled: !isEmployer
  })

  const skills = skillsData?.skills || []
  const filteredSkills = skills.filter((s: any) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(skillSearch.toLowerCase())
  )
  const grouped: Record<string, any[]> = filteredSkills.reduce((acc: any, s: any) => {
    acc[s.category] = [...(acc[s.category] || []), s]
    return acc
  }, {})

  const toggleSkill = (id: string) =>
    setSelectedSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const handleFinish = async () => {
    setLoading(true)
    try {
      if (isEmployer) {
        const res = await api.put('/employer/profile', empForm)
        setProfile(res.data.profile)
        navigate('/employer/dashboard')
      } else {
        const res = await api.put('/seeker/profile', {
          ...form,
          graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
          skill_ids: selectedSkills
        })
        setProfile(res.data.profile)
        navigate('/dashboard')
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const canProceed = () => {
    if (isEmployer) {
      if (step === 1) return empForm.company_name.trim().length > 0
      return true
    }
    if (step === 1) return form.full_name.trim().length > 0
    if (step === 2) return form.degree.trim().length > 0
    return true
  }

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const eup = (k: string, v: string) => setEmpForm(p => ({ ...p, [k]: v }))

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold">
            <span className="text-brand-green">Nexa</span><span className="text-[var(--text-primary)]">Work</span>
          </span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">{t('onboarding.step', { current: step, total: totalSteps })}</p>
            <p className="text-sm font-medium text-brand-green">{Math.round((step / totalSteps) * 100)}%</p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-green rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={clsx('w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                i + 1 < step ? 'border-brand-green bg-brand-green text-white'
                  : i + 1 === step ? 'border-brand-green text-brand-green bg-white'
                  : 'border-[var(--border)] text-gray-300 bg-white'
              )}>
                {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {!isEmployer ? (
            <>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('onboarding.seeker_step1_title')}</h2>
                  <p className="text-sm text-gray-400 mb-6">{t('onboarding.seeker_step1_desc')}</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.full_name')} *</label>
                      <input value={form.full_name} onChange={e => up('full_name', e.target.value)}
                        className="input-field" placeholder="Chanceline Mbah" autoFocus />
                    </div>
                    <Autocomplete label={t('onboarding.location')} value={form.location}
                      onChange={v => up('location', v)} suggestions={LOCATIONS} placeholder="Douala, Cameroun" />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('onboarding.seeker_step2_title')}</h2>
                  <p className="text-sm text-gray-400 mb-6">This powers your AI job matching</p>
                  <div className="space-y-4">
                    <Autocomplete label={`${t('onboarding.degree')} *`} value={form.degree}
                      onChange={v => up('degree', v)} suggestions={DEGREES} placeholder="BSc, MSc, HND..." />
                    <Autocomplete label={t('onboarding.field')} value={form.field_of_study}
                      onChange={v => up('field_of_study', v)} suggestions={FIELDS_OF_STUDY} placeholder="Computer Science..." />
                    <Autocomplete label={t('onboarding.institution')} value={form.institution}
                      onChange={v => up('institution', v)} suggestions={UNIVERSITIES} placeholder="University of Buea" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.grad_year')}</label>
                      <input type="number" value={form.graduation_year} onChange={e => up('graduation_year', e.target.value)}
                        className="input-field" placeholder="2024" min="1990" max="2030" />
                    </div>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('onboarding.seeker_step3_title')}</h2>
                  <p className="text-sm text-gray-400 mb-4">{t('onboarding.seeker_step3_desc')}</p>
                  <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)}
                    className="input-field mb-4" placeholder={t('onboarding.skills_placeholder')} />
                  {selectedSkills.length > 0 && (
                    <p className="text-xs text-brand-green font-medium mb-3">{selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected</p>
                  )}
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                    {Object.entries(grouped).map(([cat, catSkills]: any) => (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
                        <div className="flex flex-wrap gap-2">
                          {catSkills.map((skill: any) => (
                            <button key={skill.id} onClick={() => toggleSkill(skill.id)}
                              className={clsx('px-3 py-1.5 rounded-full text-sm border transition-all',
                                selectedSkills.includes(skill.id)
                                  ? 'bg-brand-green text-white border-brand-green'
                                  : 'bg-[var(--surface)] text-gray-600 border-gray-200 hover:border-brand-green'
                              )}>
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{t('onboarding.employer_step1_title')}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.company_name')} *</label>
                      <input value={empForm.company_name} onChange={e => eup('company_name', e.target.value)}
                        className="input-field" placeholder="Acme Corp" autoFocus />
                    </div>
                    <Autocomplete label={t('onboarding.industry')} value={empForm.industry}
                      onChange={v => eup('industry', v)} suggestions={INDUSTRIES} placeholder="Technology" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.company_size')}</label>
                      <select value={empForm.company_size} onChange={e => eup('company_size', e.target.value)} className="input-field">
                        <option value="">Select size</option>
                        {['1-10','11-50','51-200','201-1000','1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Company details</h2>
                  <div className="space-y-4">
                    <Autocomplete label={t('onboarding.location')} value={empForm.location}
                      onChange={v => eup('location', v)} suggestions={LOCATIONS} placeholder="Douala, Cameroun" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('onboarding.website')}</label>
                      <input value={empForm.website} onChange={e => eup('website', e.target.value)}
                        className="input-field" placeholder="https://yourcompany.com" />
                    </div>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Company description</h2>
                  <textarea value={empForm.description} onChange={e => eup('description', e.target.value)}
                    rows={5} className="input-field resize-none"
                    placeholder="Describe your company culture and what you offer..." />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">{t('onboarding.back')}</button>}
            {step < totalSteps ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="btn-primary flex-1">{t('onboarding.next')}</button>
            ) : (
              <button onClick={handleFinish} disabled={loading || !canProceed()} className="btn-gold flex-1 py-3 font-semibold">
                {loading ? 'Setting up…' : isEmployer ? t('onboarding.finish_employer') : t('onboarding.finish')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
