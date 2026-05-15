import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, X, Briefcase } from 'lucide-react'
import { api } from '../lib/api'
import JobCard, { Job } from '../components/jobs/JobCard'
import ApplyModal from '../components/jobs/ApplyModal'
import { JobCardSkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'graduate_scheme', label: 'Graduate Scheme' },
]

const WORK_MODES = [
  { value: '', label: 'All Modes' },
  { value: 'remote', label: '🌐 Remote' },
  { value: 'onsite', label: '🏢 On-site' },
  { value: 'hybrid', label: '🔀 Hybrid' },
]

const EXP_LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
]

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const q      = searchParams.get('q') || ''
  const type   = searchParams.get('type') || ''
  const mode   = searchParams.get('mode') || ''
  const level  = searchParams.get('level') || ''
  const page   = parseInt(searchParams.get('page') || '1')

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams)
    value ? p.set(key, value) : p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const hasFilters = q || type || mode || level
  const clearAll = () => setSearchParams(new URLSearchParams())

  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (type) params.set('type', type)
  if (mode === 'remote') params.set('remote', 'true')
  if (level) params.set('level', level)
  params.set('page', String(page))

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', q, type, mode, level, page],
    queryFn: () => api.get(`/jobs?${params}`).then(r => r.data),
    staleTime: 60_000
  })

  const jobs: Job[] = data?.jobs || []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Jobs</h1>
        {data?.total != null && (
          <p className="text-gray-400 text-sm mt-0.5">{data.total.toLocaleString()} jobs available</p>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={e => setParam('q', e.target.value)}
          placeholder="Search jobs, companies, skills..."
          className="input-field pl-10 pr-10" />
        {q && (
          <button onClick={() => setParam('q', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={mode} onChange={e => setParam('mode', e.target.value)}
          className="input-field w-auto text-sm py-2 pr-8 cursor-pointer">
          {WORK_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <select value={type} onChange={e => setParam('type', e.target.value)}
          className="input-field w-auto text-sm py-2 pr-8 cursor-pointer">
          {JOB_TYPES.map(jt => <option key={jt.value} value={jt.value}>{jt.label}</option>)}
        </select>

        <select value={level} onChange={e => setParam('level', e.target.value)}
          className="input-field w-auto text-sm py-2 pr-8 cursor-pointer">
          {EXP_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearAll}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-all border border-red-100">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {q     && <span className="badge badge-green text-xs">"{q}" <button onClick={() => setParam('q','')     } className="ml-1 opacity-70 hover:opacity-100">×</button></span>}
          {type  && <span className="badge badge-green text-xs">{JOB_TYPES.find(j=>j.value===type)?.label}   <button onClick={() => setParam('type','')  } className="ml-1 opacity-70 hover:opacity-100">×</button></span>}
          {mode  && <span className="badge badge-green text-xs">{WORK_MODES.find(m=>m.value===mode)?.label}  <button onClick={() => setParam('mode','')  } className="ml-1 opacity-70 hover:opacity-100">×</button></span>}
          {level && <span className="badge badge-green text-xs">{EXP_LEVELS.find(l=>l.value===level)?.label} <button onClick={() => setParam('level','') } className="ml-1 opacity-70 hover:opacity-100">×</button></span>}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <JobCardSkeletonGrid count={9} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs found"
          description="Try adjusting your search or clearing filters"
          action={{ label: 'Clear Filters', onClick: clearAll }} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => <JobCard key={job.id} job={job} onApply={setApplyJob} />)}
          </div>
          <div className="flex justify-center gap-3 mt-8">
            {page > 1 && (
              <button onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(page-1)); setSearchParams(p) }}
                className="btn-secondary px-6 py-2">← Previous</button>
            )}
            {jobs.length === 20 && (
              <button onClick={() => { const p = new URLSearchParams(searchParams); p.set('page', String(page+1)); setSearchParams(p) }}
                className="btn-primary px-6 py-2">Next →</button>
            )}
          </div>
        </>
      )}

      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  )
}
