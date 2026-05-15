import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, UserRole } from '../store/authStore'
import { useToast } from '../components/Toast'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setProfile, setInitialized } = useAuthStore()
  const { success, error: toastError } = useToast()
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    setError('')

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr

      const userRole = (data.user?.user_metadata?.role as UserRole) || 'job_seeker'

      // Set basic user immediately
      setUser({
        id: data.user.id,
        email: data.user.email || email,
        role: userRole,
        lang_preference: 'en'
      })

      // Fetch profile from Supabase directly — MUST happen before navigate
      let profileComplete = false
      try {
        const table = userRole === 'employer' ? 'profiles_employer' : 'profiles_seeker'
        const nameField = userRole === 'employer' ? 'company_name' : 'full_name'

        const { data: profileData } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
          profileComplete = !!(profileData as any)[nameField]
        }
      } catch {
        // Profile doesn't exist yet — needs onboarding
      }

      setInitialized(true)
      success('Welcome back! 👋')

      // Navigate based on profile completion
      if (!profileComplete) {
        navigate('/onboarding', { replace: true })
      } else if (userRole === 'employer') {
        navigate('/employer/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || t('auth.error_invalid'))
      toastError('Sign in failed — check your credentials')
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
            Welcome<br />back to<br /><span className="text-brand-gold">NexaWork</span>
          </p>
          <p className="text-green-200 text-lg">Africa's smartest job platform</p>
        </div>
        <p className="text-green-300 text-sm">"Your First Job Finds You"</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-1 text-sm text-gray-400 mb-6 hover:text-brand-green">
            <ArrowLeft size={16} /> Home
          </Link>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{t('auth.login_title')}</h1>
            <p className="text-gray-400 mt-1">{t('auth.login_subtitle')}</p>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                <Link to="/forgot-password" className="text-xs text-brand-green hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in…' : t('auth.sign_in')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-brand-green font-medium hover:underline">{t('auth.sign_up')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
