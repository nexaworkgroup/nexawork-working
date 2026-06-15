import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import {
  Shield, Wifi, Video, CheckCircle, Clock, AlertCircle,
  Upload, Play, RefreshCw, ChevronRight, Star, Lock
} from 'lucide-react'
import { clsx } from 'clsx'

const SESSIONS_NEEDED = 3
const MIN_SPEED_MBPS  = 5

function StepDot({ done, active, n }: { done: boolean; active: boolean; n: number }) {
  return (
    <div className={clsx(
      'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all',
      done   ? 'bg-brand-green text-white' :
      active ? 'bg-brand-green-light text-brand-green ring-2 ring-brand-green' :
               'bg-[var(--border-soft)] text-gray-400'
    )}>
      {done ? <CheckCircle size={18} /> : n}
    </div>
  )
}

export default function RemoteReadyPage() {
  const { user } = useAuthStore()
  const { success, error: toastError, info } = useToast()
  const qc = useQueryClient()

  const [testing, setTesting]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['remote-ready-status'],
    queryFn: () => api.get('/remote-ready/status').then(r => r.data),
  })

  const record: any = data?.record || null
  const sessions: any[] = record?.speed_sessions || []
  const passedSessions  = sessions.filter(s => s.passed)
  const sessionsCount   = passedSessions.length
  const speedReady      = sessionsCount >= SESSIONS_NEEDED
  const videoStatus     = record?.video_status || 'none'
  const badgeActive     = record?.badge_active === true

  // Step completion
  const step1Done = speedReady
  const step2Done = videoStatus === 'approved' || badgeActive
  const step2Pending = videoStatus === 'pending'
  const allDone   = badgeActive

  // Run speed test
  const handleSpeedTest = async () => {
    if (testing) return
    setTesting(true)
    setLastResult(null)
    try {
      const res = await api.post('/remote-ready/speed-test')
      setLastResult(res.data)
      if (res.data.passed) {
        success(`✅ ${res.data.speed_mbps} Mbps — session ${res.data.sessions_count}/${SESSIONS_NEEDED} passed!`)
      } else {
        toastError(`Speed too low: ${res.data.speed_mbps} Mbps (need ${MIN_SPEED_MBPS}+ Mbps). Try again on a better connection.`)
      }
      refetch()
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Speed test failed. Please try again.'
      toastError(msg)
    }
    setTesting(false)
  }

  // Upload video
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 100 * 1024 * 1024) { toastError('Video must be under 100MB'); return }

    setUploading(true)
    try {
      // Get signed upload URL
      const { data: urlData } = await api.get('/remote-ready/upload-url')
      const { upload_url, path } = urlData

      // Upload directly to Supabase Storage
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'video/mp4' },
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('remote-ready-videos')
        .getPublicUrl(path)

      // Submit video URL for review
      await api.post('/remote-ready/submit-video', { video_url: publicData.publicUrl })
      success('Video submitted for review! We\'ll notify you within 24 hours. 🎉')
      refetch()
    } catch (e: any) {
      toastError(e.message || 'Upload failed. Please try again.')
    }
    setUploading(false)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-8">

      {/* Header */}
      <div className="text-center mb-8">
        {badgeActive ? (
          <div className="inline-flex flex-col items-center gap-3">
            <div className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center shadow-lg">
              <Shield size={38} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">You're Remote Ready! 🎉</h1>
              <p className="text-brand-green font-medium text-sm mt-1">
                Badge active · expires {new Date(record.expires_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-brand-green-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={30} className="text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Remote Ready Badge</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Verify your internet speed and power backup to get a badge that makes your profile stand out to employers.
            </p>
          </>
        )}
      </div>

      {/* Badge active state */}
      {badgeActive && (
        <div className="bg-brand-green rounded-2xl p-5 text-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={22} />
            <p className="font-bold text-lg">Remote Ready Certified</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[var(--surface)]/10 rounded-xl p-3">
              <p className="text-white/70 text-xs mb-0.5">Avg Internet Speed</p>
              <p className="font-bold text-lg">{record.avg_speed_mbps} Mbps</p>
            </div>
            <div className="bg-[var(--surface)]/10 rounded-xl p-3">
              <p className="text-white/70 text-xs mb-0.5">Power Backup</p>
              <p className="font-bold text-lg">Verified ✓</p>
            </div>
          </div>
          <p className="text-white/60 text-xs mt-3">
            Your badge is automatically shown on your profile and all job applications.
          </p>
        </div>
      )}

      {/* Progress steps */}
      {!badgeActive && (
        <div className="bg-[var(--border-soft)] rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Progress</p>
          <div className="flex items-center gap-2">
            <StepDot done={step1Done} active={!step1Done} n={1} />
            <div className={clsx('flex-1 h-1 rounded-full', step1Done ? 'bg-brand-green' : 'bg-gray-200')} />
            <StepDot done={step2Done} active={step1Done && !step2Done} n={2} />
            <div className={clsx('flex-1 h-1 rounded-full', step2Done ? 'bg-brand-green' : 'bg-gray-200')} />
            <StepDot done={allDone} active={step2Done} n={3} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Speed Test</span>
            <span>Video Review</span>
            <span>Badge Active</span>
          </div>
        </div>
      )}

      {/* STEP 1 — Speed Test */}
      <div className={clsx('bg-[var(--surface)] border rounded-2xl p-5 mb-4 transition-all',
        step1Done ? 'border-brand-green/30' : 'border-[var(--border)] shadow-sm')}>
        <div className="flex items-start gap-3 mb-4">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            step1Done ? 'bg-brand-green text-white' : 'bg-brand-green-light text-brand-green')}>
            <Wifi size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900">Internet Speed Verification</h2>
              {step1Done && <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded-full">Done ✓</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              We test your speed from our servers — 3 passing sessions required (min {MIN_SPEED_MBPS} Mbps each).
              Tests must be at least 10 minutes apart.
            </p>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex gap-2 mb-4">
          {Array.from({ length: SESSIONS_NEEDED }).map((_, i) => {
            const session = passedSessions[i]
            return (
              <div key={i} className={clsx(
                'flex-1 rounded-xl p-2.5 text-center text-xs border transition-all',
                session
                  ? 'bg-brand-green-light border-brand-green/30 text-brand-green'
                  : 'bg-[var(--border-soft)] border-gray-100 text-gray-400'
              )}>
                <div className="font-bold mb-0.5">
                  {session ? `${session.speed_mbps}` : '--'}
                </div>
                <div className="text-[10px]">
                  {session ? 'Mbps ✓' : `Test ${i + 1}`}
                </div>
              </div>
            )
          })}
        </div>

        {/* Last result */}
        {lastResult && (
          <div className={clsx('flex items-center gap-2 p-2.5 rounded-xl text-sm mb-3',
            lastResult.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
            {lastResult.passed ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {lastResult.passed
              ? `${lastResult.speed_mbps} Mbps — passed! (${lastResult.sessions_count}/${SESSIONS_NEEDED} sessions)`
              : `${lastResult.speed_mbps} Mbps — too slow. Need ${MIN_SPEED_MBPS}+ Mbps.`}
          </div>
        )}

        {!step1Done && (
          <button onClick={handleSpeedTest} disabled={testing}
            className="btn-primary w-full py-3 gap-2 flex items-center justify-center">
            {testing ? (
              <><RefreshCw size={16} className="animate-spin" />Testing your connection…</>
            ) : (
              <><Play size={16} />Run Speed Test</>
            )}
          </button>
        )}
        {testing && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Downloading test payload from our servers… (~10s)
          </p>
        )}
      </div>

      {/* STEP 2 — Power Backup Video */}
      <div className={clsx('bg-[var(--surface)] border rounded-2xl p-5 mb-4 transition-all',
        !step1Done ? 'opacity-60 pointer-events-none border-gray-100' :
        step2Done  ? 'border-brand-green/30' : 'border-[var(--border)] shadow-sm')}>
        <div className="flex items-start gap-3 mb-4">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            step2Done ? 'bg-brand-green text-white' :
            step2Pending ? 'bg-amber-50 text-amber-600' :
            'bg-brand-green-light text-brand-green')}>
            {step2Done ? <CheckCircle size={18} /> : step2Pending ? <Clock size={18} /> : <Video size={18} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900">Power Backup Verification</h2>
              {step2Done    && <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded-full">Approved ✓</span>}
              {step2Pending && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Under Review</span>}
              {videoStatus === 'rejected' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Rejected</span>}
              {!step1Done && <Lock size={13} className="text-gray-300" />}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Record a short video (30–90s) showing your power backup solution — generator, inverter, solar, or UPS.
            </p>
          </div>
        </div>

        {/* Rejected notes */}
        {videoStatus === 'rejected' && record?.video_notes && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 text-sm text-red-600">
            <p className="font-medium mb-0.5">Review feedback:</p>
            <p>{record.video_notes}</p>
          </div>
        )}

        {/* Video requirements */}
        {!step2Done && !step2Pending && step1Done && (
          <div className="bg-[var(--border-soft)] rounded-xl p-3 mb-4 text-xs text-gray-600 space-y-1">
            {[
              'Show the power backup equipment clearly',
              'Demonstrate it is switched on and working',
              'Show your laptop/computer running on it',
              'Keep video between 30 and 90 seconds',
              'Max file size: 100MB (MP4, MOV, WebM)',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-brand-green mt-0.5">✓</span> {tip}
              </div>
            ))}
          </div>
        )}

        {step2Pending && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
            <Clock size={15} className="flex-shrink-0" />
            Your video is under review. We'll notify you within 24 hours.
          </div>
        )}

        {!step2Done && !step2Pending && step1Done && (
          <label className={clsx('flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all',
            uploading
              ? 'bg-[var(--border-soft)] text-gray-400 cursor-not-allowed'
              : 'bg-brand-gold text-white hover:bg-brand-gold/90')}>
            {uploading
              ? <><RefreshCw size={16} className="animate-spin" />Uploading…</>
              : <><Upload size={16} />{videoStatus === 'rejected' ? 'Re-upload Video' : 'Upload Power Backup Video'}</>}
            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {/* STEP 3 — Badge */}
      <div className={clsx('bg-[var(--surface)] border rounded-2xl p-5 transition-all',
        !step2Done ? 'opacity-60 border-gray-100' :
        allDone    ? 'border-brand-green/30' : 'border-[var(--border)] shadow-sm')}>
        <div className="flex items-start gap-3">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            allDone ? 'bg-brand-green text-white' : 'bg-[var(--border-soft)] text-gray-400')}>
            <Shield size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900">Remote Ready Badge</h2>
              {!step2Done && <Lock size={13} className="text-gray-300" />}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {allDone
                ? 'Your badge is active and visible on your profile and all job applications.'
                : 'Complete both steps above to earn your badge. Valid for 12 months.'}
            </p>
          </div>
        </div>
      </div>

      {/* Why it matters */}
      {!badgeActive && (
        <div className="mt-6 bg-brand-green rounded-2xl p-5 text-white">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Star size={16} className="text-brand-gold" /> Why get Remote Ready?
          </h3>
          <div className="space-y-2.5">
            {[
              ['📈', 'Get noticed faster', 'Employers filter for Remote Ready candidates first'],
              ['💼', 'Higher salary offers', 'Verified candidates typically negotiate 15–30% higher'],
              ['🌍', 'Global opportunities', 'International employers trust verified infrastructure'],
              ['🏆', 'Stand out', 'Only a fraction of candidates have this badge'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-2.5">
                <span className="text-lg">{icon}</span>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-white/70 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
