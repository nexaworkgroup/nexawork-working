import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { api } from '../lib/api'
import JobCard, { Job } from '../components/jobs/JobCard'
import ApplyModal from '../components/jobs/ApplyModal'

export default function SavedJobsPage() {
  const qc = useQueryClient()
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: () => api.get('/seeker/saved-jobs').then(r => r.data)
  })

  const saved = data?.saved_jobs || []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
        <p className="text-gray-400 text-sm mt-0.5">{saved.length} saved</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-48" />)}
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
          <p>No saved jobs yet. Browse jobs and save the ones you like!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((s: any) => (
            <JobCard
              key={s.job_id}
              job={s.jobs}
              onApply={setApplyJob}
              onSaveToggle={() => qc.invalidateQueries({ queryKey: ['saved-jobs'] })}
            />
          ))}
        </div>
      )}

      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  )
}
