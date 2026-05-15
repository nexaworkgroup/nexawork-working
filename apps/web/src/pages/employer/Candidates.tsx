import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { Zap, MapPin, GraduationCap, Download } from 'lucide-react'
import { clsx } from 'clsx'

const STATUSES = ['applied','viewed','shortlisted','interview','offered','rejected']
const STATUS_COLOURS: Record<string,string> = {
  applied:'bg-gray-100 text-gray-600', viewed:'bg-blue-50 text-blue-600',
  shortlisted:'bg-brand-gold-light text-brand-gold-dark', interview:'bg-purple-50 text-purple-600',
  offered:'bg-brand-green-light text-brand-green', rejected:'bg-red-50 text-red-500'
}

export default function CandidatesPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', jobId],
    queryFn: () => api.get(`/employer/jobs/${jobId}/candidates`).then(r => r.data)
  })

  const updateStatus = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      api.put(`/employer/applications/${appId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates', jobId] })
  })

  const candidates = data?.candidates || []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <p className="text-gray-400 text-sm mt-0.5">{candidates.length} applicant{candidates.length !== 1 ? 's' : ''} — sorted by AI match score</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-28" />)}</div>
      ) : candidates.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No applications yet.</div>
      ) : (
        <div className="space-y-4">
          {candidates.map((app: any) => {
            const p = app.profiles_seeker
            const skills = p?.seeker_skills?.map((s: any) => s.skills?.name).filter(Boolean) || []
            return (
              <div key={app.id} className="card">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">
                      {p?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p?.full_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {p?.location && <span className="flex items-center gap-1"><MapPin size={11}/>{p.location}</span>}
                        {p?.degree && <span className="flex items-center gap-1"><GraduationCap size={11}/>{p.degree} in {p.field_of_study}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {app.ai_match_score && (
                      <div className="flex items-center gap-1 bg-brand-green text-white px-2.5 py-1 rounded-full text-xs font-bold">
                        <Zap size={11} /> {app.ai_match_score}%
                      </div>
                    )}
                    {p?.cv_url && (
                      <a href={p.cv_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-green hover:underline">
                        <Download size={12}/> CV
                      </a>
                    )}
                  </div>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {skills.slice(0, 8).map((s: string) => (
                      <span key={s} className="badge badge-gray text-xs">{s}</span>
                    ))}
                  </div>
                )}

                {app.cover_letter && (
                  <p className="text-sm text-gray-500 italic mb-3 line-clamp-2">"{app.cover_letter}"</p>
                )}

                {/* ATS status */}
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus.mutate({ appId: app.id, status: s })}
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                        app.status === s
                          ? STATUS_COLOURS[s] + ' border-current'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                      )}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
