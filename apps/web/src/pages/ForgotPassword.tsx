import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo = `${window.location.origin}/reset-password`

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        {sent ? (
          <div className="card text-center py-10">
            <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-brand-green" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              We sent a password reset link to <strong>{email}</strong>.
              Check your inbox and click the link to reset your password.
            </p>
            <p className="text-xs text-gray-400">Didn't receive it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} className="text-brand-green hover:underline">try again</button>.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-brand-green-light rounded-xl flex items-center justify-center mb-4">
                <Mail size={24} className="text-brand-green" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
              <p className="text-gray-400 mt-1 text-sm">Enter your email and we'll send you a reset link.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com" required autoFocus />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-brand-green font-medium hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
