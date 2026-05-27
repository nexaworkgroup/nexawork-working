import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Phone, CreditCard, Shield, Loader } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { clsx } from 'clsx'

const PLAN_DETAILS: Record<string, { name: string; role: string }> = {
  seeker_pro:    { name: 'Seeker Pro',   role: 'job_seeker' },
  employer_pro:  { name: 'Employer Pro', role: 'employer' },
}

const PRICES: Record<string, { monthly: number; yearly: number }> = {
  seeker_pro:   { monthly: 2500,  yearly: 25000 },
  employer_pro: { monthly: 15000, yearly: 150000 },
}

type PayMethod = 'orange' | 'mtn' | 'card'

export default function CheckoutPage() {
  const { planId = '' } = useParams<{ planId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const billing = (searchParams.get('billing') || 'monthly') as 'monthly' | 'yearly'
  const plan = PLAN_DETAILS[planId]
  const price = PRICES[planId]?.[billing] || 0

  const [method, setMethod] = useState<PayMethod>('orange')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!plan) {
    navigate('/pricing')
    return null
  }

  const handlePay = async () => {
    if ((method === 'orange' || method === 'mtn') && !phone.trim()) {
      toastError('Please enter your phone number')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/subscriptions/initiate', {
        plan_id: planId,
        billing,
        payment_method: method,
        phone: phone || undefined
      })

      if (method === 'card' && res.data.checkout_url) {
        // Redirect to Stripe
        window.location.href = res.data.checkout_url
      } else {
        // Mobile money — show pending state
        setDone(true)
        success('Payment request sent to your phone! Confirm it to activate your subscription.')
      }
    } catch (e: any) {
      toastError(e.message || 'Payment failed. Please try again.')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="card max-w-md w-full text-center py-12">
          <div className="w-20 h-20 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone size={36} className="text-brand-green" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Phone! 📱</h2>
          <p className="text-gray-500 mb-2">A payment request has been sent to <strong>{phone}</strong>.</p>
          <p className="text-gray-400 text-sm mb-6">
            Approve the {method === 'orange' ? 'Orange Money' : 'MTN MoMo'} request to activate your {plan.name} subscription instantly.
          </p>
          <div className="bg-brand-gold-light rounded-xl p-4 mb-6 text-sm text-brand-gold-dark">
            ⏳ Waiting for payment confirmation… This page will update automatically.
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full py-2.5">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto p-4 sm:p-6">
        <button onClick={() => navigate('/pricing')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Pricing
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Upgrade</h1>

        {/* Order summary */}
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">NexaWork {plan.name}</span>
            <span className="font-semibold text-gray-900">{price.toLocaleString()} XAF</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Billing</span>
            <span className="text-gray-700 capitalize">{billing}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="font-bold text-xl text-brand-green">{price.toLocaleString()} XAF</span>
          </div>
        </div>

        {/* Payment method */}
        <div className="card mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-2 mb-4">
            {([
              { id: 'orange' as PayMethod, label: 'Orange Money',      emoji: '🟠', desc: 'Pay via Orange Money transfer' },
              { id: 'mtn'    as PayMethod, label: 'MTN Mobile Money',  emoji: '🟡', desc: 'Pay via MTN MoMo transfer' },
              { id: 'card'   as PayMethod, label: 'Card (Visa/MC)',     emoji: '💳', desc: 'Pay securely with Stripe' },
            ]).map(({ id, label, emoji, desc }) => (
              <button key={id} onClick={() => setMethod(id)}
                className={clsx('w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                  method === id ? 'border-brand-green bg-brand-green-light' : 'border-gray-200 hover:border-gray-300')}>
                <span className="text-xl flex-shrink-0">{emoji}</span>
                <div className="flex-1">
                  <p className={clsx('text-sm font-semibold', method === id ? 'text-brand-green' : 'text-gray-700')}>{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <div className={clsx('w-4 h-4 rounded-full border-2 flex-shrink-0', method === id ? 'border-brand-green bg-brand-green' : 'border-gray-300')} />
              </button>
            ))}
          </div>

          {/* Phone field for mobile money */}
          {(method === 'orange' || method === 'mtn') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {method === 'orange' ? 'Orange' : 'MTN'} Phone Number
              </label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 flex-shrink-0">
                  🇨🇲 +237
                </span>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="input-field flex-1" placeholder="6XX XXX XXX"
                  type="tel" maxLength={9} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                You'll receive a {method === 'orange' ? 'Orange Money' : 'MTN MoMo'} payment request on this number
              </p>
            </div>
          )}

          {method === 'card' && (
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
              <Shield size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600">Secure payment powered by Stripe. Your card details are never stored on our servers.</p>
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mb-5 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Shield size={13} />Secure</span>
          <span className="flex items-center gap-1">✓ Cancel anytime</span>
          <span className="flex items-center gap-1">✓ Instant activation</span>
        </div>

        <button onClick={handlePay} disabled={loading}
          className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20">
          {loading
            ? <><Loader size={18} className="animate-spin" />Processing…</>
            : <>Pay {price.toLocaleString()} XAF · Activate {plan.name}</>}
        </button>
      </div>
    </div>
  )
}
