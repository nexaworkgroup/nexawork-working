import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, X, Zap, Crown, Building2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { clsx } from 'clsx'

const SEEKER_PLANS = [
  {
    id: 'seeker_free', name: 'Free', price: { monthly: 0, yearly: 0 },
    badge: null, icon: Zap, popular: false,
    features: [
      { label: '10 applications/month',   ok: true },
      { label: 'AI job matching feed',    ok: true },
      { label: 'Basic profile',           ok: true },
      { label: '1 job alert',             ok: true },
      { label: 'CV Builder',              ok: true },
      { label: 'Unlimited applications',  ok: false },
      { label: 'Priority AI matching',    ok: false },
      { label: 'CV expert review',        ok: false },
      { label: 'Profile boost',           ok: false },
      { label: 'WhatsApp job alerts',     ok: false },
    ]
  },
  {
    id: 'seeker_pro', name: 'Pro', price: { monthly: 2500, yearly: 25000 },
    badge: 'Most Popular', icon: Crown, popular: true,
    features: [
      { label: 'Unlimited applications',  ok: true },
      { label: 'Priority AI matching',    ok: true },
      { label: 'Full profile features',   ok: true },
      { label: 'Unlimited job alerts',    ok: true },
      { label: 'CV Builder + PDF export', ok: true },
      { label: 'CV expert review',        ok: true },
      { label: 'Profile boost',           ok: true },
      { label: 'WhatsApp job alerts',     ok: true },
      { label: 'Interview coaching',      ok: true },
      { label: 'Full salary insights',    ok: true },
    ]
  },
]

const EMPLOYER_PLANS = [
  {
    id: 'employer_free', name: 'Free', price: { monthly: 0, yearly: 0 },
    badge: null, icon: Building2, popular: false,
    features: [
      { label: '2 active job postings',   ok: true },
      { label: '10 applicants per job',   ok: true },
      { label: 'Basic ATS pipeline',      ok: true },
      { label: 'Company profile',         ok: true },
      { label: 'Unlimited postings',      ok: false },
      { label: 'Unlimited applicants',    ok: false },
      { label: 'AI candidate matching',   ok: false },
      { label: 'Hiring analytics',        ok: false },
      { label: 'Verified badge',          ok: false },
      { label: 'Priority support',        ok: false },
    ]
  },
  {
    id: 'employer_pro', name: 'Pro', price: { monthly: 15000, yearly: 150000 },
    badge: 'Best Value', icon: Crown, popular: true,
    features: [
      { label: 'Unlimited postings',      ok: true },
      { label: 'Unlimited applicants',    ok: true },
      { label: 'AI candidate matching',   ok: true },
      { label: 'Full hiring analytics',   ok: true },
      { label: 'Verified employer badge', ok: true },
      { label: 'Interview scheduling',    ok: true },
      { label: 'CV download access',      ok: true },
      { label: 'Priority in search',      ok: true },
      { label: 'Email + WhatsApp support',ok: true },
      { label: 'API access',              ok: true },
    ]
  },
]

export default function PricingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [role, setRole] = useState<'seeker' | 'employer'>(user?.role === 'employer' ? 'employer' : 'seeker')

  const plans = role === 'seeker' ? SEEKER_PLANS : EMPLOYER_PLANS

  const handleUpgrade = (planId: string) => {
    if (!user) { navigate('/register'); return }
    navigate(`/checkout/${planId}?billing=${billing}`)
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <Link to={user ? (user.role === 'employer' ? '/employer/dashboard' : '/dashboard') : '/'}>
          <span className="text-xl font-bold"><span className="text-brand-green">Nexa</span><span className="text-gray-900">Work</span></span>
        </Link>
        {!user && (
          <div className="flex gap-2">
            <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple, Transparent Pricing</h1>
          <p className="text-gray-400 text-lg">Start free. Upgrade when you're ready.</p>
        </div>

        {/* Role + Billing toggles */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {(['seeker', 'employer'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={clsx('px-5 py-2 rounded-lg text-sm font-medium transition-all',
                  role === r ? 'bg-brand-green text-white' : 'text-gray-500 hover:text-gray-700')}>
                {r === 'seeker' ? '👤 Job Seeker' : '🏢 Employer'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 justify-center">
            <span className={clsx('text-sm', billing === 'monthly' ? 'font-medium text-gray-900' : 'text-gray-400')}>Monthly</span>
            <button onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
              className={clsx('relative w-12 h-6 rounded-full transition-colors', billing === 'yearly' ? 'bg-brand-green' : 'bg-gray-200')}>
              <div className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', billing === 'yearly' ? 'translate-x-6' : 'translate-x-0.5')} />
            </button>
            <span className={clsx('text-sm', billing === 'yearly' ? 'font-medium text-gray-900' : 'text-gray-400')}>
              Yearly <span className="text-brand-green font-semibold">−17%</span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {plans.map(plan => {
            const Icon = plan.icon
            const price = plan.price[billing]
            const isFree = price === 0
            return (
              <div key={plan.id} className={clsx('bg-white rounded-2xl border-2 overflow-hidden',
                plan.popular ? 'border-brand-green ring-2 ring-brand-green/30' : 'border-gray-200')}>
                <div className={clsx('px-6 py-5', plan.popular ? 'bg-brand-green' : 'bg-gray-50')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={20} className={plan.popular ? 'text-brand-gold' : 'text-gray-500'} />
                      <span className={clsx('font-bold text-lg', plan.popular ? 'text-white' : 'text-gray-900')}>{plan.name}</span>
                    </div>
                    {plan.badge && <span className="bg-brand-gold text-white text-xs font-bold px-2.5 py-1 rounded-full">{plan.badge}</span>}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={clsx('text-4xl font-bold', plan.popular ? 'text-white' : 'text-gray-900')}>
                      {isFree ? 'Free' : price.toLocaleString()}
                    </span>
                    {!isFree && <span className={clsx('text-sm mb-1', plan.popular ? 'text-green-200' : 'text-gray-400')}>XAF/{billing === 'monthly' ? 'mo' : 'yr'}</span>}
                  </div>
                  {!isFree && billing === 'yearly' && (
                    <p className={clsx('text-xs mt-1', plan.popular ? 'text-green-200' : 'text-gray-400')}>
                      ≈ {Math.round(price/12).toLocaleString()} XAF/month
                    </p>
                  )}
                </div>
                <div className="px-6 py-5">
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f.label} className="flex items-center gap-3">
                        {f.ok ? <CheckCircle size={15} className="text-brand-green flex-shrink-0" /> : <X size={15} className="text-gray-300 flex-shrink-0" />}
                        <span className={clsx('text-sm', f.ok ? 'text-gray-700' : 'text-gray-300')}>{f.label}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => !isFree && handleUpgrade(plan.id)} disabled={isFree}
                    className={clsx('w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                      isFree ? 'bg-gray-100 text-gray-400 cursor-default' :
                      plan.popular ? 'bg-brand-green text-white hover:opacity-90 shadow-lg shadow-brand-green/20' :
                      'border-2 border-gray-200 text-gray-600 hover:border-brand-green hover:text-brand-green')}>
                    {isFree ? 'Your current plan' : <><Crown size={15} />Get {plan.name}<ArrowRight size={15} /></>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment methods */}
        <div className="card text-center mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">We accept</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'Orange Money', emoji: '🟠', color: 'bg-orange-50 text-orange-600 border-orange-200' },
              { name: 'MTN MoMo',     emoji: '🟡', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
              { name: 'Visa / Mastercard', emoji: '💳', color: 'bg-blue-50 text-blue-600 border-blue-200' },
              { name: 'Bank Transfer', emoji: '🏦', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            ].map(({ name, emoji, color }) => (
              <span key={name} className={clsx('flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium', color)}>
                {emoji} {name}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Secure · Cancel anytime · No hidden fees</p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes — cancel with no penalties. You keep access until your billing period ends.' },
            { q: 'How do I pay with Orange Money or MTN MoMo?', a: "Select mobile money at checkout. You'll receive a payment prompt on your phone to confirm." },
            { q: 'Is there a free trial?', a: 'Our free plan has no time limit. Upgrade only when you need more.' },
            { q: 'Employers: can I post jobs for free?', a: 'Yes — 2 active postings and up to 10 applicants per job on the free plan.' },
          ].map(({ q, a }) => (
            <div key={q} className="card">
              <p className="font-semibold text-gray-900 mb-1">{q}</p>
              <p className="text-sm text-gray-500">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
