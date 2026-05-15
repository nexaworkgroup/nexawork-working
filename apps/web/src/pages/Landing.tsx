import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Zap, ArrowRight, Users, Briefcase, TrendingUp, Globe, Star,
  CheckCircle2, MessageSquare, Brain, Search, Shield, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import { useEffect, useState } from 'react'

function LanguageToggle() {
  const { i18n } = useTranslation()
  const toggle = () => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')
  return (
    <button onClick={toggle}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-green transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
      <Globe size={15} />
      {i18n.language === 'en' ? 'FR' : 'EN'}
    </button>
  )
}

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Matching', desc: 'Our engine reads your profile and surfaces the jobs most likely to hire you — before you even search.' },
  { icon: Search, title: 'Jobs From Everywhere', desc: 'LinkedIn, Indeed, MTN, Orange, local boards — all in one feed, deduplicated and ranked for you.' },
  { icon: MessageSquare, title: 'AI Career Assistant', desc: 'Ask in plain English or French. Find jobs, prep for interviews, build your CV — all in one chat.' },
  { icon: Shield, title: 'Built for Fresh Graduates', desc: 'No CV? No experience? No problem. Our Skills DNA profile gets you matched without work history.' },
]

const COMPANIES = ['MTN', 'Orange', 'Afriland', 'UBA', 'Nestlé', 'Dangote', 'UNICEF', 'Ecobank']

const FAQS = [
  { q: 'Do I need a CV to sign up?', a: 'No. NexaWork builds your Skills DNA from your degree, skills, and interests. Upload a CV later to improve your matches.' },
  { q: 'Where do the jobs come from?', a: 'We aggregate from LinkedIn, Indeed, Glassdoor, local Cameroon boards, and direct company career pages — updated every 6 hours.' },
  { q: 'Is NexaWork free?', a: 'Yes — completely free for job seekers. Employers get 3 free job postings per month, with paid plans for more.' },
  { q: 'What languages does it support?', a: 'English and French — switch anytime with the toggle in the top right corner.' },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [stats] = useState({ jobs: '10,000+', companies: '500+', placed: '2,000+' })

  useEffect(() => {
    api.get('/jobs?page=1').then(r => setRecentJobs(r.data.jobs?.slice(0, 6) || [])).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span className="text-2xl font-bold">
            <span className="text-brand-green">Nexa</span>
            <span className="text-gray-900">Work</span>
          </span>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-brand-green transition-colors">Features</a>
            <a href="#jobs" className="text-sm text-gray-500 hover:text-brand-green transition-colors">Jobs</a>
            <a href="#faq" className="text-sm text-gray-500 hover:text-brand-green transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link to="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-brand-green transition-colors">
              {t('nav.login')}
            </Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-green-light via-white to-brand-gold-light pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-green/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white border border-brand-green/20 rounded-full px-4 py-1.5 text-sm text-brand-green font-medium mb-8 shadow-sm">
            <Zap size={14} className="text-brand-gold" />
            Africa's #1 AI-Powered Job Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6">
            {t('landing.hero_title')}{' '}
            <span className="relative inline-block">
              <span className="text-brand-green">{t('landing.hero_title_accent')}</span>
              <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-brand-gold rounded-full" />
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-2 justify-center rounded-xl shadow-lg shadow-brand-green/20">
              {t('landing.cta_seeker')} <ArrowRight size={18} />
            </Link>
            <Link to="/register?role=employer" className="btn-secondary text-base px-8 py-4 rounded-xl">
              {t('landing.cta_employer')}
            </Link>
          </div>

          {/* Social proof */}
          <p className="text-sm text-gray-400 mb-4">Trusted by graduates from leading institutions</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-gray-400">
            {['UB', 'ENSP', 'IUT Douala', 'ESSEC', 'FMSB', 'IRIC'].map(school => (
              <span key={school} className="bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm">
                {school}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-brand-green">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { icon: Briefcase, value: stats.jobs, label: t('landing.stat_jobs') },
            { icon: Users, value: stats.companies, label: t('landing.stat_companies') },
            { icon: TrendingUp, value: stats.placed, label: t('landing.stat_placed') },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <Icon size={28} className="text-brand-gold mx-auto mb-3" />
              <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
              <p className="text-sm text-green-200 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.how_title')}</h2>
            <p className="text-gray-400 text-lg">From sign-up to job offer in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: t('landing.step1_title'), desc: t('landing.step1_desc'), color: 'bg-brand-green', light: 'bg-brand-green-light' },
              { num: '02', title: t('landing.step2_title'), desc: t('landing.step2_desc'), color: 'bg-brand-gold', light: 'bg-brand-gold-light' },
              { num: '03', title: t('landing.step3_title'), desc: t('landing.step3_desc'), color: 'bg-brand-green', light: 'bg-brand-green-light' },
            ].map(({ num, title, desc, color, light }) => (
              <div key={num} className="relative">
                <div className={`w-16 h-16 ${light} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <span className={`text-2xl font-bold ${color === 'bg-brand-green' ? 'text-brand-green' : 'text-brand-gold-dark'}`}>{num}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">{title}</h3>
                <p className="text-gray-500 leading-relaxed text-center">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24 bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to land your first job</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">NexaWork combines AI matching, job aggregation, and career coaching in one platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-all">
                <div className="w-12 h-12 bg-brand-green-light rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-brand-green" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      {recentJobs.length > 0 && (
        <section id="jobs" className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Latest Opportunities</h2>
                <p className="text-gray-400 mt-1">Fresh jobs added every 6 hours from across Africa</p>
              </div>
              <Link to="/register" className="btn-secondary text-sm px-4 py-2 hidden sm:block">
                View All Jobs →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentJobs.map((job: any) => (
                <div key={job.id} className="card hover:shadow-card-hover transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-green-light flex items-center justify-center text-brand-green font-bold text-sm flex-shrink-0">
                      {job.company_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-brand-green transition-colors">{job.title}</p>
                      <p className="text-xs text-gray-400 truncate">{job.company_name}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.job_type && (
                      <span className="badge badge-green text-xs">{job.job_type.replace('_', ' ')}</span>
                    )}
                    {job.is_remote && <span className="badge badge-gray text-xs">Remote</span>}
                    {job.location && <span className="text-xs text-gray-400">{job.location}</span>}
                  </div>
                  <Link to="/register" className="text-xs text-brand-green font-medium hover:underline">
                    Sign up to apply →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Companies */}
      <section className="py-16 bg-surface">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-8">Jobs from leading employers</p>
          <div className="flex flex-wrap justify-center gap-4">
            {COMPANIES.map(c => (
              <div key={c} className="bg-white border border-gray-100 rounded-xl px-6 py-3 shadow-sm font-semibold text-gray-600">
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For graduates CTA */}
      <section className="py-24 bg-brand-green">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Star size={36} className="text-brand-gold mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">{t('landing.for_graduates')}</h2>
          <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            {t('landing.for_graduates_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center gap-2 bg-brand-gold text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-gold-dark transition-colors shadow-lg">
              Start Free — No CV Needed <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              ['✓', 'Free forever for job seekers'],
              ['✓', 'No CV required to start'],
              ['✓', 'English & French'],
            ].map(([check, text]) => (
              <div key={text} className="text-center">
                <span className="text-brand-gold font-bold text-lg">{check}</span>
                <p className="text-green-100 text-xs mt-1">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-surface transition-colors">
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-50">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-surface">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to find your first job?</h2>
          <p className="text-gray-400 text-lg mb-8">Join thousands of African graduates already using NexaWork.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-4 rounded-xl shadow-lg shadow-brand-green/20 inline-flex items-center gap-2">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold">
            <span className="text-brand-green">Nexa</span>
            <span className="text-gray-900">Work</span>
          </span>
          <p className="text-sm text-gray-400">© 2026 NexaWork · Built for Africa 🌍</p>
          <LanguageToggle />
        </div>
      </footer>
    </div>
  )
}
