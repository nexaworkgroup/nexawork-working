import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to NexaWork
        </Link>
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: May 2026</p>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
              <p>By accessing or using NexaWork ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h2>
              <p>NexaWork is an AI-powered employment platform that connects job seekers with employers across Africa. We aggregate job listings from multiple sources and use artificial intelligence to match candidates with relevant opportunities.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. User Accounts</h2>
              <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. NexaWork is not liable for any loss or damage from your failure to protect your login information.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Acceptable Use</h2>
              <p>You agree not to: post false or misleading job listings; create fake profiles or misrepresent your qualifications; use the platform to spam or harass other users; attempt to circumvent our AI matching systems; or use the platform for any illegal purposes.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Employer Responsibilities</h2>
              <p>Employers posting jobs on NexaWork must ensure all listings are legitimate, comply with applicable employment laws in Cameroon and their respective jurisdictions, and treat all applicants fairly regardless of protected characteristics.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. AI-Generated Content</h2>
              <p>NexaWork uses AI to generate CV content, job descriptions, and career advice. This content is provided as a starting point and should be reviewed and personalised before use. We do not guarantee the accuracy of AI-generated recommendations.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Limitation of Liability</h2>
              <p>NexaWork does not guarantee employment outcomes. We are a platform connecting parties and are not responsible for the hiring decisions of employers or the qualifications of applicants.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
              <p>For questions about these terms, contact us at <a href="mailto:legal@nexawork.app" className="text-brand-green hover:underline">legal@nexawork.app</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
