import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Globe, Users, Briefcase, ArrowLeft, Building2, ExternalLink } from 'lucide-react'
import { api } from '../lib/api'
import JobCard, { Job } from '../components/jobs/JobCard'
import { useState } from 'react'
import ApplyModal from '../components/jobs/ApplyModal'

export default function CompanyProfilePage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const [applyJob, setApplyJob] = useState<Job | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => api.get(`/companies/${companyId}`).then(r => r.data)
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data?.company) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Building2 size={40} className="mx-auto mb-3 opacity-30" />
        <p>Company not found</p>
        <button onClick={() => navigate('/jobs')} className="btn-primary mt-4 text-sm px-5">Browse Jobs</button>
      </div>
    </div>
  )

  const { company, jobs } = data

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Company header */}
        <div className="card mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-brand-green-light flex items-center justify-center text-brand-green text-3xl font-bold flex-shrink-0">
              {company.company_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{company.company_name}</h1>
                {company.is_verified && (
                  <span className="badge badge-green text-xs">✓ Verified</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                {company.industry && (
                  <span className="flex items-center gap-1.5"><Briefcase size={14} />{company.industry}</span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{company.location}</span>
                )}
                {company.company_size && (
                  <span className="flex items-center gap-1.5"><Users size={14} />{company.company_size} employees</span>
                )}
              </div>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-green hover:underline">
                  <Globe size={14} /> {company.website.replace(/^https?:\/\//, '')}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {company.description && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-2">About {company.company_name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{company.description}</p>
            </div>
          )}
        </div>

        {/* Active jobs */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-green" />
            Open Positions ({jobs?.length || 0})
          </h2>
          {jobs?.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p>No open positions at the moment</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {(jobs || []).map((job: Job) => (
                <JobCard key={job.id} job={job} onApply={setApplyJob} />
              ))}
            </div>
          )}
        </div>
      </div>
      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  )
}
