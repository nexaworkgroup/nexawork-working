import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import { Users, MapPin, GraduationCap, Download, Zap, Search, ChevronDown, Calendar, Mail } from 'lucide-react'
import { clsx } from 'clsx'

const STATUSES = ['applied', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected']

const STATUS_STYLES: Record<string, string> = {
  applied:     'bg-gray-100 text-gray-600',
  viewed:      'bg-blue-50 text-blue-600',
  shortlisted: 'bg-brand-gold-light text-brand-gold-dark',
  interview:   'bg-purple-50 text-purple-600',
  offered:     'bg-brand-green-light text-brand-green',
  rejected:    'bg-red-50 text-red-500',
}

export default function ApplicantsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const [search, setSearch] = useState('')
  const [filterJob, setFilterJob] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  // Local optimistic status state — no waiting for server
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({})

  const { data: jobsData } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data)
  })

  const jobs = jobsData?.jobs || []

  const { data, isLoading } = useQuery({
    queryKey: ['all-candidates', filterJob],
    queryFn: async () => {
      if (filterJob !== 'all') {
        const res = await api.get(`/employer/jobs/${filterJob}/candidates`)
        return res.data.candidates || []
      }
      const results = await Promise.all(
        jobs.map((j: any) =>
          api.get(`/employer/jobs/${j.id}/candidates`)
            .then(r => (r.data.candidates || []).map((c: any) => ({ ...c, _job_title: j.title, _job_id: j.id })))
            .catch(() => [])
        )
      )
      return results.flat()
    },
    enabled: jobs.length > 0
  })

  // Optimistic status update — instant UI, fire-and-forget API
  const updateStatus = (appId: string, status: string) => {
    // Update UI immediately
    setLocalStatuses(prev => ({ ...prev, [appId]: status }))

    // Fire API in background
    api.put(`/employer/applications/${appId}/status`, { status })
      .then(() => {
        success(`Moved to ${status}`)
        qc.invalidateQueries({ queryKey: ['all-candidates'] })
      })
      .catch(() => {
        // Revert on failure
        setLocalStatuses(prev => {
          const next = { ...prev }
          delete next[appId]
          return next
        })
        toastError('Failed to update status')
      })
  }

  const allCandidates: any[] = data || []

  const filtered = allCandidates.filter(app => {
    const p = app.profiles_seeker
    const matchesSearch = !search ||
      p?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      app._job_title?.toLowerCase().includes(search.toLowerCase()) ||
      p?.degree?.toLowerCase().includes(search.toLowerCase())
    const effectiveStatus = localStatuses[app.id] || app.status
    const matchesStatus = filterStatus === 'all' || effectiveStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  const pipeline = STATUSES.reduce((acc, s) => {
    acc[s] = allCandidates.filter(a => (localStatuses[a.id] || a.status) === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Applicants</h1>
        <p className="text-gray-400 text-sm mt-0.5">{allCandidates.length} total across {jobs.length} job postings</p>
      </div>

      {/* Pipeline summary — clickable */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={clsx('card text-center py-3 cursor-pointer hover:shadow-card-hover transition-all',
              filterStatus === s && 'ring-2 ring-brand-green')}>
            <p className="text-2xl font-bold text-gray-900">{pipeline[s]}</p>
            <p className={clsx('text-xs font-medium mt-0.5 capitalize px-2 py-0.5 rounded-full inline-block', STATUS_STYLES[s])}>{s}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, degree, job title..." className="input-field pl-9 text-sm" />
        </div>
        <select value={filterJob} onChange={e => setFilterJob(e.target.value)} className="input-field sm:w-56 text-sm">
          <option value="all">All Job Postings</option>
          {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-44 text-sm">
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Applicant list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{allCandidates.length === 0 ? 'Post a job to start receiving applications' : 'No applicants match your filters'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => {
            const p = app.profiles_seeker
            const skills = p?.seeker_skills?.map((s: any) => s.skills?.name).filter(Boolean) || []
            const isExpanded = expanded === app.id
            const currentStatus = localStatuses[app.id] || app.status

            return (
              <div key={app.id} className="card">
                {/* Main row */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {p?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{p?.full_name || 'Anonymous'}</p>
                      {app.ai_match_score && (
                        <span className="flex items-center gap-0.5 bg-brand-green text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          <Zap size={10} />{app.ai_match_score}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                      {p?.location && <span className="flex items-center gap-1"><MapPin size={11}/>{p.location}</span>}
                      {p?.degree && <span className="flex items-center gap-1"><GraduationCap size={11}/>{p.degree} — {p.field_of_study}</span>}
                      {app._job_title && <span className="text-brand-green font-medium">→ {app._job_title}</span>}
                    </div>
                  </div>

                  {/* Status badge + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx('badge text-xs capitalize', STATUS_STYLES[currentStatus])}>
                      {currentStatus}
                    </span>
                    {p?.cv_url && (
                      <a href={p.cv_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-green" title="Download CV">
                        <Download size={15} />
                      </a>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                      <ChevronDown size={15} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.slice(0, 12).map((s: string) => (
                            <span key={s} className="badge badge-gray text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cover letter */}
                    {app.cover_letter && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Cover Letter</p>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">"{app.cover_letter}"</p>
                      </div>
                    )}

                    {/* ATS pipeline buttons */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Move to Stage</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map(s => (
                          <button key={s} onClick={() => updateStatus(app.id, s)}
                            className={clsx(
                              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize',
                              currentStatus === s
                                ? STATUS_STYLES[s] + ' border-current font-bold ring-1 ring-current'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            )}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Schedule Interview CTA — prominent */}
                    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                      <Calendar size={18} className="text-purple-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900">Ready to interview {p?.full_name?.split(' ')[0] || 'this candidate'}?</p>
                        <p className="text-xs text-purple-500">Schedule a video, phone, or in-person interview</p>
                      </div>
                      <button
                        onClick={() => navigate(`/employer/interviews/schedule/${app.id}`)}
                        className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0">
                        <Calendar size={13} /> Schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
