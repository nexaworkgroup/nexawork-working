import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to NexaWork
        </Link>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={28} className="text-brand-green" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-400 text-sm mb-8">Last updated: May 2026</p>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
              <p>We collect information you provide directly: name, email, location, education, work history, skills, and CV content. We also collect usage data including jobs viewed, applied to, and saved.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
              <p>Your data is used to: power AI job matching (your profile is converted to a vector embedding for similarity search); connect you with employers; send relevant notifications; improve our platform; and generate AI career guidance personalised to you.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. AI & Machine Learning</h2>
              <p>Your profile information is processed by OpenAI's API to generate embeddings and AI responses. This processing is subject to OpenAI's privacy policy. We do not use your data to train external AI models.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Data Sharing</h2>
              <p>When you apply to a job, your profile and skills are shared with the employer. We do not sell your personal data to third parties. Job aggregation sources (LinkedIn, Indeed, etc.) are publicly available listings.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Storage</h2>
              <p>Your data is stored securely on Supabase (PostgreSQL) infrastructure hosted in the EU. We use row-level security to ensure users can only access their own data.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Your Rights</h2>
              <p>You have the right to: access your personal data; correct inaccurate data; delete your account and all associated data; export your data; and withdraw consent at any time.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Cookies</h2>
              <p>We use only essential cookies for authentication. We do not use tracking or advertising cookies.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact</h2>
              <p>For privacy concerns: <a href="mailto:privacy@nexawork.app" className="text-brand-green hover:underline">privacy@nexawork.app</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
