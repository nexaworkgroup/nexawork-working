import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { TrendingUp, Search, MapPin, Briefcase, DollarSign } from 'lucide-react'
import { Autocomplete, FIELDS_OF_STUDY } from '../components/ui/Autocomplete'

const JOB_TITLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Product Manager', 'Marketing Manager', 'Financial Analyst',
  'Accountant', 'Project Manager', 'Sales Manager', 'HR Manager',
  'Network Engineer', 'Cybersecurity Analyst', 'DevOps Engineer', 'Mobile Developer',
  'Business Analyst', 'Graphic Designer', 'Content Writer', 'Teacher'
]

const LOCATIONS = ['Douala', 'Yaoundé', 'Buea', 'Bamenda', 'Remote', 'Africa']

export default function SalaryInsightsPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [searched, setSearched] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['salary-insights', jobTitle, location],
    queryFn: () => api.get(`/jobs/salary-insights?title=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}`).then(r => r.data),
    enabled: false
  })

  const handleSearch = () => {
    if (!jobTitle.trim()) return
    setSearched(true)
    refetch()
  }

  const insights = data?.insights

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign size={22} className="text-brand-green" /> Salary Insights
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Research salary ranges for any role in Africa</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Autocomplete label="Job Title" value={jobTitle} onChange={setJobTitle}
            suggestions={JOB_TITLES} placeholder="Software Engineer" />
          <Autocomplete label="Location" value={location} onChange={setLocation}
            suggestions={LOCATIONS} placeholder="Douala, Cameroun" />
        </div>
        <button onClick={handleSearch} disabled={!jobTitle.trim() || isLoading}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
          {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Researching…</> : <><Search size={16} />Get Salary Data</>}
        </button>
      </div>

      {/* Results */}
      {searched && (
        isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card animate-pulse h-20" />)}
          </div>
        ) : !insights ? (
          <div className="card text-center py-12 text-gray-400">
            <DollarSign size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No salary data found for "{jobTitle}"</p>
            <p className="text-sm mt-1">Try a broader job title or different location</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main salary card */}
            <div className="card bg-brand-green text-white">
              <p className="text-green-200 text-sm mb-1">{insights.title} in {insights.location || 'Africa'}</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-xs text-green-300 mb-1">Median Salary</p>
                  <p className="text-4xl font-bold">{insights.median?.toLocaleString()} XAF</p>
                  <p className="text-green-200 text-sm mt-1">per month</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-2xl font-bold">{insights.min?.toLocaleString()}</p>
                  <p className="text-green-300 text-xs">Min (XAF)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-gold">{insights.median?.toLocaleString()}</p>
                  <p className="text-green-300 text-xs">Median (XAF)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{insights.max?.toLocaleString()}</p>
                  <p className="text-green-300 text-xs">Max (XAF)</p>
                </div>
              </div>
            </div>

            {/* Range bar */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Salary Range</h3>
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute h-full bg-gradient-to-r from-brand-green/30 to-brand-green rounded-full"
                  style={{ left: '0%', right: '0%' }} />
                <div className="absolute h-full w-1 bg-brand-gold"
                  style={{ left: `${insights.medianPct || 50}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{insights.min?.toLocaleString()} XAF</span>
                <span className="text-brand-gold font-medium">▲ Median: {insights.median?.toLocaleString()}</span>
                <span>{insights.max?.toLocaleString()} XAF</span>
              </div>
            </div>

            {/* Job count */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Market Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-brand-green">{insights.jobCount || 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Jobs with salary data</p>
                </div>
                <div className="bg-surface rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{insights.totalJobs || 0}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total matching jobs</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                📊 Based on {insights.jobCount || 0} job postings on NexaWork with reported salaries.
                {insights.jobCount < 5 && " Limited data — range may not be representative."}
              </p>
            </div>

            {/* Tips */}
            <div className="card bg-brand-gold-light border-brand-gold/20">
              <h3 className="font-semibold text-gray-900 mb-2">💡 Negotiation Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
                <li>Start your negotiation at or above the median salary</li>
                <li>Research the company size — larger companies typically pay more</li>
                <li>Factor in benefits: transport, healthcare, and bonuses</li>
                <li>Remote roles often offer USD/EUR rates — worth applying</li>
              </ul>
            </div>
          </div>
        )
      )}

      {/* Popular searches */}
      {!searched && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Popular searches in Cameroon</p>
          <div className="flex flex-wrap gap-2">
            {['Software Engineer', 'Financial Analyst', 'Marketing Manager', 'Data Scientist', 'Project Manager', 'Accountant'].map(title => (
              <button key={title} onClick={() => { setJobTitle(title); setSearched(true) }}
                className="badge badge-gray text-sm cursor-pointer hover:border-brand-green hover:text-brand-green transition-colors px-3 py-1.5">
                {title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
