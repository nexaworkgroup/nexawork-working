import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Zap, MapPin, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'

interface Props { jobId: string; tags?: string[]; title?: string }

export default function SimilarJobs({ jobId, tags = [], title = '' }: Props) {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['similar-jobs', jobId],
    queryFn: async () => {
      // Search by keywords from title
      const keyword = title.split(' ').slice(0, 2).join(' ')
      const res = await api.get(`/jobs?q=${encodeURIComponent(keyword)}&page=1`)
      // Filter out current job
      const jobs = (res.data.jobs || []).filter((j: any) => j.id !== jobId).slice(0, 4)
      return jobs
    },
    enabled: !!jobId && !!title,
    staleTime: 120_000
  })

  const jobs = data || []
  if (isLoading || jobs.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Zap size={16} className="text-brand-gold" />
        Similar Jobs
      </h3>
      <div className="space-y-2">
        {jobs.map((job: any) => (
          <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)}
            className="card p-4 cursor-pointer hover:shadow-card-hover transition-all group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 group-hover:text-brand-green transition-colors truncate">
                  {job.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{job.company_name}</p>
                {job.location && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {job.location}
                  </p>
                )}
              </div>
              {job.match_score > 0 && (
                <span className="badge badge-green text-xs flex-shrink-0">
                  <Zap size={10} className="mr-0.5" />{job.match_score}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
