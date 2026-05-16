import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Zap, BookOpen, ArrowRight, Target } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

// Top skills in demand from our job pool
const TOP_SKILLS = [
  { skill: 'Python',         jobs: 340, category: 'Technology',  learn: 'https://python.org/about/gettingstarted/' },
  { skill: 'React',          jobs: 285, category: 'Technology',  learn: 'https://react.dev/learn' },
  { skill: 'SQL',            jobs: 410, category: 'Technology',  learn: 'https://www.w3schools.com/sql/' },
  { skill: 'Docker',         jobs: 198, category: 'Technology',  learn: 'https://docs.docker.com/get-started/' },
  { skill: 'Node.js',        jobs: 220, category: 'Technology',  learn: 'https://nodejs.org/en/learn' },
  { skill: 'Project Management', jobs: 310, category: 'Business', learn: 'https://www.pmi.org/learning' },
  { skill: 'Data Science',   jobs: 175, category: 'Technology',  learn: 'https://www.kaggle.com/learn' },
  { skill: 'Marketing',      jobs: 265, category: 'Business',    learn: 'https://learndigital.withgoogle.com/' },
  { skill: 'Communication',  jobs: 450, category: 'Soft Skills', learn: null },
  { skill: 'Leadership',     jobs: 380, category: 'Soft Skills', learn: null },
  { skill: 'AWS',            jobs: 160, category: 'Technology',  learn: 'https://aws.amazon.com/training/' },
  { skill: 'TypeScript',     jobs: 195, category: 'Technology',  learn: 'https://www.typescriptlang.org/docs/' },
]

export default function SkillGapPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const { data: seekerProfile } = useQuery({
    queryKey: ['seeker-profile-skills'],
    queryFn: () => api.get('/seeker/profile').then(r => r.data)
  })

  const mySkills: string[] = (seekerProfile?.profile?.seeker_skills || [])
    .map((s: any) => s.skills?.name?.toLowerCase()).filter(Boolean)

  const missingSkills = TOP_SKILLS.filter(s => !mySkills.includes(s.skill.toLowerCase()))
  const acquiredSkills = TOP_SKILLS.filter(s => mySkills.includes(s.skill.toLowerCase()))

  const totalOpportunities = missingSkills.reduce((sum, s) => sum + s.jobs, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Target size={24} className="text-brand-green" />
          Skill Gap Advisor
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          See which skills unlock more job opportunities for you
        </p>
      </div>

      {/* Summary card */}
      <div className="card mb-6 bg-brand-green text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Zap size={28} className="text-brand-gold" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalOpportunities.toLocaleString()}+</p>
            <p className="text-green-200 text-sm">additional jobs you could unlock by learning new skills</p>
          </div>
        </div>
        <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <p className="text-xl font-bold">{acquiredSkills.length}</p>
            <p className="text-green-200 text-xs">Skills you have</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{missingSkills.length}</p>
            <p className="text-green-200 text-xs">Skills to unlock</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{mySkills.length}</p>
            <p className="text-green-200 text-xs">Total skills</p>
          </div>
        </div>
      </div>

      {/* Missing skills — unlock these */}
      {missingSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-gold" />
            Skills to Learn — Unlock More Jobs
          </h2>
          <div className="space-y-2">
            {missingSkills.sort((a, b) => b.jobs - a.jobs).map(s => (
              <div key={s.skill} className="card flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{s.skill}</p>
                    <span className="badge badge-gray text-xs">{s.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-gold rounded-full"
                        style={{ width: `${Math.min(100, (s.jobs / 450) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-brand-gold-dark flex-shrink-0">
                      +{s.jobs} jobs
                    </span>
                  </div>
                </div>
                {s.learn ? (
                  <a href={s.learn} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-brand-green font-medium hover:underline flex-shrink-0">
                    <BookOpen size={13} /> Learn
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 flex-shrink-0">Soft skill</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills you already have */}
      {acquiredSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap size={18} className="text-brand-green" />
            Skills You Already Have ✅
          </h2>
          <div className="flex flex-wrap gap-2">
            {acquiredSkills.map(s => (
              <div key={s.skill} className="flex items-center gap-1.5 bg-brand-green-light text-brand-green px-3 py-1.5 rounded-full text-sm font-medium">
                <span>✓</span> {s.skill}
                <span className="text-xs opacity-70">({s.jobs} jobs)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="card bg-surface border-brand-green/20 border">
        <p className="font-medium text-gray-900 mb-2">Ready to add more skills to your profile?</p>
        <p className="text-sm text-gray-500 mb-4">
          Adding skills improves your AI match score and surfaces more relevant jobs in your feed.
        </p>
        <button onClick={() => navigate('/profile')}
          className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
          Update My Skills <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
