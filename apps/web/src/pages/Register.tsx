import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ArrowLeft, Briefcase, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, UserRole } from '../store/authStore'
import { clsx } from 'clsx'

type Role = 'job_seeker' | 'employer'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setUser, setInitialized } = useAuthStore()
  const submitting = useRef(false) // Prevent double submission

  const [role, setRole] = useState<Role>(
    params.get('role') === 'employer' ? 'employer' : 'job_seeker'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return // Block double submission
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    submitting.current = true
    setLoading(true)
    setError('')

    try {
      // Sign out any existing session first to avoid state conflicts
      await supabase.auth.signOut()

      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role } }
      })

      if (authErr) throw authErr
      if (!data.user) throw new Error('Registration failed')

      // Set user in store
      setUser({
        id: data.user.id,
        email: data.user.email || email,
        role: role as UserRole,
        lang_preference: 'en'
      })
      setInitialized(true)

      // Navigate with React Router (no hard reload)
      navigate('/onboarding', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-green p-12 text-white">
        <Link to="/" className="flex items-center gap-2 text-green-200 hover:text-white transition-colors">
          <ArrowLeft size={18} /> Back to home
        </Link>
        <div>
          <p className="text-5xl font-bold leading-tight mb-4">
            Start your<br />career journey<br />
            <span className="text-brand-gold">today</span>
          </p>
          <p className="text-green-200 text-lg">No CV required. No experience needed.</p>
        </div>
        <p className="text-green-300 text-sm">"Your First Job Finds You"</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-1 text-sm text-gray-400 mb-6 hover:text-brand-green">
            <ArrowLeft size={16} /> Home
          </Link>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('auth.register_title')}</h1>
            <p className="text-gray-400 mt-1">{t('auth.register_subtitle')}</p>
          </div>

          <p className="text-sm font-medium text-gray-700 mb-3">{t('auth.choose_role')}</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {([
              { val: 'job_seeker' as Role, icon: User, label: t('auth.role_seeker'), desc: t('auth.role_seeker_desc') },
              { val: 'employer' as Role, icon: Briefcase, label: t('auth.role_employer'), desc: t('auth.role_employer_desc') },
            ]).map(({ val, icon: Icon, label, desc }) => (
              <button key={val} type="button" onClick={() => setRole(val)}
                className={clsx(
                  'flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center',
                  role === val ? 'border-brand-green bg-brand-green-light' : 'border-gray-200 hover:border-gray-300'
                )}>
                <Icon size={24} className={role === val ? 'text-brand-green' : 'text-gray-400'} />
                <span className={clsx('text-sm font-semibold mt-2', role === val ? 'text-brand-green' : 'text-gray-700')}>{label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{desc}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  required minLength={8}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Creating account…' : t('auth.sign_up')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-brand-green font-medium hover:underline">{t('auth.sign_in')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
