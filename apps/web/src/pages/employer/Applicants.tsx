import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import {
  Users, MapPin, GraduationCap, Download, Zap,
  Search, Filter, ChevronDown, Mail, Calendar
} from 'lucide-react'
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
  const [search, setSearch] = useState('')
  const [filterJob, setFilterJob] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Fetch all employer jobs
  const { data: jobsData } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data)
  })

  const jobs = jobsData?.jobs || []

  // Fetch applicants for selected job or all jobs
  const { data, isLoading } = useQuery({
    queryKey: ['all-candidates', filterJob],
    queryFn: async () => {
      if (filterJob !== 'all') {
        const res = await api.get(`/employer/jobs/${filterJob}/candidates`)
        return res.data.candidates || []
      }
      // Fetch all jobs' candidates in parallel
      const results = await Promise.all(
        jobs.map((j: any) =>
          api.get(`/employer/jobs/${j.id}/candidates`)
            .then(r => (r.data.candidates || []).map((c: any) => ({ ...c, _job_title: j.title })))
            .catch(() => [])
        )
      )
      return results.flat()
    },
    enabled: jobs.length > 0
  })

  const updateStatus = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      api.put(`/employer/applications/${appId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-candidates'] })
  })

  const allCandidates: any[] = data || []

  // Filter
  const filtered = allCandidates.filter(app => {
    const p = app.profiles_seeker
    const matchesSearch = !search ||
      p?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      app._job_title?.toLowerCase().includes(search.toLowerCase()) ||
      p?.degree?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Group by status for pipeline view
  const pipeline = STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter(a => a.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Applicants</h1>
        <p className="text-gray-400 text-sm mt-0.5">{allCandidates.length} total across {jobs.length} job postings</p>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={clsx(
              'card text-center py-3 cursor-pointer hover:shadow-card-hover transition-all',
              filterStatus === s ? 'ring-2 ring-brand-green' : ''
            )}>
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
            placeholder="Search by name, degree, job title..."
            className="input-field pl-9 text-sm" />
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
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No applicants found</p>
          <p className="text-sm mt-1">
            {allCandidates.length === 0 ? 'Post a job to start receiving applications' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => {
            const p = app.profiles_seeker
            const skills = p?.seeker_skills?.map((s: any) => s.skills?.name).filter(Boolean) || []
            const isExpanded = expanded === app.id

            return (
              <div key={app.id} className="card">
                {/* Main row */}
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {p?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{p?.full_name || 'Anonymous'}</p>
                      {app.ai_match_score && (
                        <span className="flex items-center gap-0.5 bg-brand-green text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          <Zap size={10} /> {app.ai_match_score}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                      {p?.location && <span className="flex items-center gap-1"><MapPin size={11}/>{p.location}</span>}
                      {p?.degree && <span className="flex items-center gap-1"><GraduationCap size={11}/>{p.degree} — {p.field_of_study}</span>}
                      {app._job_title && <span className="text-brand-green font-medium">→ {app._job_title}</span>}
                      <span className="flex items-center gap-1"><Calendar size={11}/>{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx('badge text-xs capitalize', STATUS_STYLES[app.status])}>
                      {app.status}
                    </span>
                    {p?.cv_url && (
                      <a href={p.cv_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-green transition-colors" title="Download CV">
                        <Download size={15} />
                      </a>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                      <ChevronDown size={15} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                {/* Expanded view */}
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
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic leading-relaxed">
                          "{app.cover_letter}"
                        </p>
                      </div>
                    )}

                    {/* Bio */}
                    {p?.bio && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">About</p>
                        <p className="text-sm text-gray-600">{p.bio}</p>
                      </div>
                    )}

                    {/* ATS status buttons */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map(s => (
                          <button key={s} onClick={() => updateStatus.mutate({ appId: app.id, status: s })}
                            className={clsx(
                              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize',
                              app.status === s
                                ? STATUS_STYLES[s] + ' border-current font-bold'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            )}>
                            {s}
                          </button>
                        ))}
                      </div>
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
