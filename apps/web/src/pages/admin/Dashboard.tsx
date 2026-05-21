import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import {
  BarChart2, Users, Briefcase, FileText, RefreshCw,
  Database, Zap, AlertTriangle, CheckCircle,
  Clock, Globe, Trash2, Shield, TrendingUp, Play, Lock, Eye, EyeOff
} from 'lucide-react'
import { clsx } from 'clsx'

type Tab = 'overview' | 'jobs' | 'users' | 'scraper'

// ── Admin Login Gate ─────────────────────────────────
function AdminLogin({ onAuth }: { onAuth: (secret: string) => void }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    setError('')
    try {
      // Verify secret against API
      const res = await api.get('/admin/stats', {
        headers: { 'x-admin-secret': value }
      })
      if (res.status === 200) {
        sessionStorage.setItem('nw_admin_secret', value)
        onAuth(value)
      }
    } catch (e: any) {
      setError('Invalid admin secret. Access denied.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-green/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-brand-green" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the admin secret to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-sm text-red-400 flex items-center gap-2">
            <Lock size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Admin secret key"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green pr-12"
              autoFocus
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" disabled={loading || !value.trim()}
            className="w-full bg-brand-green hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><RefreshCw size={16} className="animate-spin" />Verifying…</> : <><Shield size={16} />Access Admin Panel</>}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          This page is restricted to NexaWork administrators only.
        </p>
      </div>
    </div>
  )
}

// ── Main Admin Dashboard ──────────────────────────────
export default function AdminDashboard() {
  const { success, error: toastError } = useToast()
  const qc = useQueryClient()

  // Check session for stored secret
  const [secret, setSecret] = useState(() => sessionStorage.getItem('nw_admin_secret') || '')
  const [tab, setTab] = useState<Tab>('overview')
  const [scrapeSource, setScrapeSource] = useState('all')
  const [scraping, setScraping] = useState(false)
  const [embedding, setEmbedding] = useState(false)

  // Show login gate if no secret
  if (!secret) return <AdminLogin onAuth={setSecret} />

  const headers = { 'x-admin-secret': secret }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats', { headers }).then(r => r.data),
    refetchInterval: 30_000,
    retry: false,
    // If 403, clear secret and force re-login
    throwOnError: (err: any) => {
      if (err?.response?.status === 403) { sessionStorage.removeItem('nw_admin_secret'); setSecret('') }
      return false
    }
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users', { headers }).then(r => r.data),
    enabled: tab === 'users'
  })

  const { data: jobsData } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => api.get('/admin/jobs', { headers }).then(r => r.data),
    enabled: tab === 'jobs'
  })

  const handleScrape = async () => {
    setScraping(true)
    try {
      const res = await api.post('/admin/scrape', { sources: scrapeSource }, { headers })
      success(`Scrape complete: ${res.data.inserted || 0} new jobs`)
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    } catch (e: any) { toastError(e.message) }
    setScraping(false)
  }

  const handleEmbed = async () => {
    setEmbedding(true)
    try {
      const res = await api.post('/admin/embed', {}, { headers })
      success(`Embedding: ${res.data.embedded || 0} jobs processed`)
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    } catch (e: any) { toastError(e.message) }
    setEmbedding(false)
  }

  const deleteJob = useMutation({
    mutationFn: (jobId: string) => api.delete(`/admin/jobs/${jobId}`, { headers }),
    onSuccess: () => { success('Job deleted'); qc.invalidateQueries({ queryKey: ['admin-jobs', 'admin-stats'] }) },
    onError: () => toastError('Failed to delete job')
  })

  const s = stats || {}

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'jobs',     label: 'Jobs',     icon: Briefcase },
    { key: 'users',    label: 'Users',    icon: Users },
    { key: 'scraper',  label: 'Scraper',  icon: Globe },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-brand-green" />
          <span className="text-lg font-bold"><span className="text-brand-green">Nexa</span>Work Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400 hidden sm:block">Live</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem('nw_admin_secret'); setSecret('') }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
            <Lock size={12} /> Logout
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-14 sm:w-48 bg-gray-900 border-r border-gray-800 flex flex-col py-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx('flex items-center gap-3 px-3 sm:px-4 py-3 text-sm font-medium transition-all',
                tab === key ? 'bg-brand-green text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
              <Icon size={18} className="flex-shrink-0" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
          <div className="mt-auto px-3 sm:px-4 pb-2">
            <a href="/dashboard" className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-300 transition-colors">
              <span className="hidden sm:block">← Back to App</span>
              <span className="sm:hidden">←</span>
            </a>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-6">Platform Overview</h1>
              {statsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-gray-800 rounded-xl h-20 animate-pulse" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Total Jobs',    value: s.totalJobs    || 0, icon: Briefcase,   color: 'text-brand-green' },
                      { label: 'Active Jobs',   value: s.activeJobs   || 0, icon: CheckCircle, color: 'text-green-400' },
                      { label: 'Total Users',   value: s.totalUsers   || 0, icon: Users,       color: 'text-blue-400' },
                      { label: 'Seekers',       value: s.seekers      || 0, icon: TrendingUp,  color: 'text-purple-400' },
                      { label: 'Employers',     value: s.employers    || 0, icon: Briefcase,   color: 'text-brand-gold' },
                      { label: 'Applications',  value: s.applications || 0, icon: FileText,    color: 'text-pink-400' },
                      { label: 'Interviews',    value: s.interviews   || 0, icon: Clock,       color: 'text-orange-400' },
                      { label: 'Embedded Jobs', value: s.embeddedJobs || 0, icon: Zap,         color: 'text-yellow-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700">
                        <Icon size={16} className={`${color} mb-2`} />
                        <p className="text-xl sm:text-2xl font-bold">{value.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  {s.bySource && Object.keys(s.bySource).length > 0 && (
                    <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
                      <h2 className="font-semibold mb-4 text-xs uppercase tracking-wide text-gray-400">Jobs by Source</h2>
                      <div className="space-y-3">
                        {Object.entries(s.bySource).map(([source, count]: any) => (
                          <div key={source} className="flex items-center gap-3">
                            <span className="text-sm text-gray-300 w-32 sm:w-44 capitalize truncate text-xs sm:text-sm">
                              {source.replace('scraped_', '').replace(/_/g, ' ')}
                            </span>
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-green rounded-full"
                                style={{ width: `${Math.min(100, (count / (s.totalJobs || 1)) * 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium w-8 text-right text-gray-300">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* JOBS */}
          {tab === 'jobs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Jobs</h1>
                <span className="text-sm text-gray-400">{jobsData?.total || 0} total</span>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                      <th className="text-left px-4 py-3">Title</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Company</th>
                      <th className="text-left px-4 py-3">Source</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-center px-4 py-3">AI</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(jobsData?.jobs || []).map((job: any) => (
                      <tr key={job.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-4 py-3 font-medium text-white max-w-[160px] truncate text-xs sm:text-sm">{job.title}</td>
                        <td className="px-4 py-3 text-gray-400 max-w-[120px] truncate text-xs hidden sm:table-cell">{job.company_name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded capitalize">
                            {job.source?.replace('scraped_', '') || 'native'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${job.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {job.is_active ? 'Active' : 'Closed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {job.embedding ? <CheckCircle size={14} className="text-green-400 mx-auto" /> : <AlertTriangle size={14} className="text-yellow-500 mx-auto" />}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { if (confirm('Delete?')) deleteJob.mutate(job.id) }}
                            className="p-1.5 hover:bg-red-900/30 rounded text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl sm:text-2xl font-bold">Users</h1>
                <span className="text-sm text-gray-400">{usersData?.total || 0} total</span>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Name</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usersData?.users || []).map((user: any) => (
                      <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-white text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${user.role === 'employer' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-blue-900/50 text-blue-400'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{user.profile_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCRAPER */}
          {tab === 'scraper' && (
            <div className="max-w-2xl">
              <h1 className="text-xl sm:text-2xl font-bold mb-6">Job Aggregation</h1>
              <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700 mb-4">
                <h2 className="font-semibold mb-1 flex items-center gap-2 text-sm sm:text-base">
                  <Globe size={16} className="text-brand-green" />Run Scraper
                </h2>
                <p className="text-xs text-gray-500 mb-4">Auto-runs every 6 hours. Trigger manually to fetch immediately.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select value={scrapeSource} onChange={e => setScrapeSource(e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="all">All Sources</option>
                    <option value="seeds">Seeds Only</option>
                    <option value="jsearch">JSearch (LinkedIn/Indeed)</option>
                    <option value="mtn">MTN Cameroon</option>
                    <option value="orange">Orange Cameroon</option>
                  </select>
                  <button onClick={handleScrape} disabled={scraping}
                    className="flex items-center justify-center gap-2 bg-brand-green hover:opacity-90 px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                    {scraping ? <><RefreshCw size={15} className="animate-spin" />Running…</> : <><Play size={15} />Run Now</>}
                  </button>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700 mb-4">
                <h2 className="font-semibold mb-1 flex items-center gap-2 text-sm sm:text-base">
                  <Zap size={16} className="text-yellow-400" />Generate Embeddings
                </h2>
                <p className="text-xs text-gray-500 mb-4">Creates AI vectors for jobs without them. Required for AI matching.</p>
                <button onClick={handleEmbed} disabled={embedding}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {embedding ? <><RefreshCw size={15} className="animate-spin" />Embedding…</> : <><Zap size={15} />Embed Unprocessed Jobs</>}
                </button>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm"><Database size={16} />Status</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Jobs',  value: s.totalJobs    || 0 },
                    { label: 'Active',      value: s.activeJobs   || 0 },
                    { label: 'Embedded',    value: s.embeddedJobs || 0 },
                    { label: 'Missing AI',  value: (s.totalJobs || 0) - (s.embeddedJobs || 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{value.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
