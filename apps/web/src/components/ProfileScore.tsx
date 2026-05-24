import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, ArrowRight, Zap } from 'lucide-react'
import { clsx } from 'clsx'

interface ScoreItem {
  label: string
  done: boolean
  points: number
  action?: string
  to?: string
}

export default function ProfileScore() {
  const { profile, user } = useAuthStore()
  const navigate = useNavigate()
  const p = profile as any

  const items: ScoreItem[] = [
    { label: 'Full name added',        done: !!p?.full_name,         points: 10, to: '/profile' },
    { label: 'Location set',           done: !!p?.location,          points: 10, to: '/profile' },
    { label: 'Education completed',    done: !!(p?.degree && p?.institution), points: 20, to: '/profile' },
    { label: 'Bio written',            done: !!p?.bio,               points: 10, to: '/profile' },
    { label: 'Skills added (3+)',      done: (p?.seeker_skills?.length || 0) >= 3, points: 20, to: '/profile' },
    { label: 'CV uploaded',            done: !!p?.cv_url,            points: 15, to: '/profile' },
    { label: 'Profile photo',          done: !!p?.avatar_url,        points: 10, to: '/profile' },
    { label: 'Open to Work enabled',   done: !!p?.is_open_to_work,   points: 5,  to: '/profile' },
  ]

  const score = items.filter(i => i.done).reduce((sum, i) => sum + i.points, 0)
  const missing = items.filter(i => !i.done)

  const color = score >= 80 ? 'text-brand-green' : score >= 50 ? 'text-brand-gold-dark' : 'text-red-500'
  const bgColor = score >= 80 ? 'bg-brand-green' : score >= 50 ? 'bg-brand-gold' : 'bg-red-500'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Zap size={18} className="text-brand-gold" /> Profile Score
        </h2>
        <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full',
          score >= 80 ? 'bg-brand-green-light text-brand-green' :
          score >= 50 ? 'bg-brand-gold-light text-brand-gold-dark' : 'bg-red-50 text-red-500')}>
          {label}
        </span>
      </div>

      {/* Score circle */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9155" fill="none"
              stroke={score >= 80 ? '#1A7A4A' : score >= 50 ? '#E8B84B' : '#ef4444'}
              strokeWidth="3" strokeDasharray={`${score} 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={clsx('text-lg font-bold', color)}>{score}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Out of 100 points</p>
          <p className="text-xs text-gray-400 mt-1">
            {score >= 80 ? 'Great! You\'re getting the best AI matches.' :
             score >= 50 ? 'Good progress! Complete more sections for better matches.' :
             'Complete your profile to unlock AI job matching.'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div className={clsx('h-full rounded-full transition-all duration-700', bgColor)}
          style={{ width: `${score}%` }} />
      </div>

      {/* Missing items */}
      {missing.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Complete to improve score</p>
          <div className="space-y-2">
            {missing.slice(0, 3).map(item => (
              <button key={item.label} onClick={() => item.to && navigate(item.to)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left group">
                <AlertCircle size={15} className="text-gray-300 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-500">{item.label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-brand-green">+{item.points}pts</span>
                  <ArrowRight size={13} className="text-gray-300 group-hover:text-brand-green transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {items.filter(i => i.done).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1.5">
            {items.filter(i => i.done).map(item => (
              <span key={item.label} className="flex items-center gap-1 text-xs text-brand-green bg-brand-green-light px-2 py-1 rounded-full">
                <CheckCircle size={11} /> {item.label.split(' ').slice(0, 2).join(' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
