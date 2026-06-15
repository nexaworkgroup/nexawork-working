import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'
import https from 'https'
import http from 'http'

const SPEED_PAYLOAD_MB = 5
const MIN_SPEED_MBPS   = 5
const SESSIONS_NEEDED  = 3

// Server-side speed test — downloads a payload and measures real throughput
function measureServerSpeed(): Promise<number> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    let bytes = 0
    // Use a reliable CDN endpoint for measurement
    const options = {
      hostname: 'speed.cloudflare.com',
      path: `/__down?bytes=${SPEED_PAYLOAD_MB * 1024 * 1024}`,
      method: 'GET',
      timeout: 15000,
    }
    const req = https.request(options, (res) => {
      res.on('data', (chunk) => { bytes += chunk.length })
      res.on('end', () => {
        const elapsed = (Date.now() - startTime) / 1000
        const mbps    = (bytes * 8) / (elapsed * 1_000_000)
        resolve(Math.round(mbps * 100) / 100)
      })
    })
    req.on('error', () => resolve(0))
    req.on('timeout', () => { req.destroy(); resolve(0) })
    req.end()
  })
}

export async function remoteReadyRoutes(app: FastifyInstance) {

  // GET /remote-ready/status — get current badge state
  app.get('/remote-ready/status', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase.from('remote_ready')
      .select('*').eq('user_id', id).maybeSingle()
    return reply.send({ record: data || null })
  })

  // POST /remote-ready/speed-test — one server-side speed session
  app.post('/remote-ready/speed-test', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!

    // Get or create record
    let { data: record } = await supabase.from('remote_ready')
      .select('*').eq('user_id', id).maybeSingle()

    // Already has badge — no need to re-test
    if (record?.badge_active) {
      return reply.send({ already_verified: true, record })
    }

    // Run server-side speed measurement
    const speedMbps = await measureServerSpeed()
    const passed    = speedMbps >= MIN_SPEED_MBPS
    const session   = {
      timestamp: new Date().toISOString(),
      speed_mbps: speedMbps,
      passed,
    }

    const existingSessions: any[] = record?.speed_sessions || []

    // Prevent spam — only allow 1 session per 10 minutes
    const lastSession = existingSessions[existingSessions.length - 1]
    if (lastSession) {
      const minutesSinceLast = (Date.now() - new Date(lastSession.timestamp).getTime()) / 60000
      if (minutesSinceLast < 10) {
        return reply.status(429).send({
          error: `Please wait ${Math.ceil(10 - minutesSinceLast)} more minutes before the next test.`
        })
      }
    }

    const newSessions     = [...existingSessions, session].slice(-10)
    const passedSessions  = newSessions.filter(s => s.passed)
    const sessionsCount   = passedSessions.length
    const avgSpeed        = passedSessions.length > 0
      ? passedSessions.reduce((s, x) => s + x.speed_mbps, 0) / passedSessions.length
      : 0

    const upsertData: any = {
      user_id:        id,
      speed_sessions: newSessions,
      sessions_count: sessionsCount,
      avg_speed_mbps: Math.round(avgSpeed * 100) / 100,
      updated_at:     new Date().toISOString(),
    }

    if (record) {
      const { data: updated } = await supabase.from('remote_ready')
        .update(upsertData).eq('user_id', id).select().maybeSingle()
      record = updated
    } else {
      const { data: created } = await supabase.from('remote_ready')
        .insert(upsertData).select().maybeSingle()
      record = created
    }

    return reply.send({
      session,
      speed_mbps:     speedMbps,
      passed,
      sessions_count: sessionsCount,
      sessions_needed: SESSIONS_NEEDED,
      speed_ready:    sessionsCount >= SESSIONS_NEEDED,
      record,
    })
  })

  // POST /remote-ready/submit-video — submit power backup video URL
  app.post('/remote-ready/submit-video', { preHandler: authenticate }, async (request, reply) => {
    const { id }             = request.user!
    const { video_url }      = request.body as { video_url: string }

    if (!video_url) return reply.status(400).send({ error: 'video_url required' })

    let { data: record } = await supabase.from('remote_ready')
      .select('*').eq('user_id', id).maybeSingle()

    const upsertData: any = {
      user_id:        id,
      power_video_url: video_url,
      video_status:   'pending',
      submitted_at:   new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    }

    if (record) {
      const { data } = await supabase.from('remote_ready')
        .update(upsertData).eq('user_id', id).select().maybeSingle()
      record = data
    } else {
      const { data } = await supabase.from('remote_ready')
        .insert(upsertData).select().maybeSingle()
      record = data
    }

    // Notify admins (non-blocking)
    Promise.resolve(
      supabase.from('notifications').insert({
        user_id: id,
        type:    'remote_ready',
        title:   'Power backup video submitted',
        message: 'Your video is under review. We\'ll notify you within 24 hours.',
        is_read: false,
      })
    ).catch(() => {})

    return reply.send({ record })
  })

  // GET /remote-ready/video-upload-url — get signed upload URL from Supabase Storage
  app.get('/remote-ready/upload-url', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const filename = `${id}/power-backup-${Date.now()}.mp4`
    const { data, error } = await supabase.storage
      .from('remote-ready-videos')
      .createSignedUploadUrl(filename)
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ upload_url: data.signedUrl, path: filename })
  })

  // ── ADMIN ROUTES ────────────────────────────────────────

  // GET /remote-ready/admin/queue — pending video reviews
  app.get('/remote-ready/admin/queue', { preHandler: authenticate }, async (request, reply) => {
    const { data: rr } = await supabase.from('remote_ready')
      .select('*, profiles_seeker(full_name, location)')
      .eq('video_status', 'pending')
      .order('submitted_at', { ascending: true })
    return reply.send({ queue: rr || [] })
  })

  // PUT /remote-ready/admin/review/:userId — approve or reject
  app.put('/remote-ready/admin/review/:userId', { preHandler: authenticate }, async (request, reply) => {
    const { userId }        = request.params as { userId: string }
    const { decision, notes } = request.body as { decision: 'approved' | 'rejected'; notes?: string }
    const { id: adminId }   = request.user!

    const speedReady = await supabase.from('remote_ready')
      .select('sessions_count').eq('user_id', userId).maybeSingle()
    const hasEnoughSpeed = (speedReady.data?.sessions_count || 0) >= SESSIONS_NEEDED

    const badgeActive = decision === 'approved' && hasEnoughSpeed
    const expiresAt   = badgeActive
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null

    await supabase.from('remote_ready').update({
      video_status: decision,
      video_notes:  notes || null,
      badge_active: badgeActive,
      reviewed_at:  new Date().toISOString(),
      reviewed_by:  adminId,
      expires_at:   expiresAt,
    }).eq('user_id', userId)

    // Update seeker profile badge flag
    await supabase.from('profiles_seeker')
      .update({ remote_ready_active: badgeActive })
      .eq('user_id', userId)

    // Notify candidate
    const msg = badgeActive
      ? '🎉 Congratulations! Your Remote Ready badge has been approved. It will be visible on your profile and applications.'
      : `Your Remote Ready submission was not approved. ${notes || 'Please re-record your video and resubmit.'}`

    Promise.resolve(supabase.from('notifications').insert({
      user_id: userId,
      type:    'remote_ready',
      title:   badgeActive ? '🛡️ Remote Ready Badge Approved!' : 'Remote Ready Review Update',
      message: msg,
      is_read: false,
    })).catch(() => {})

    return reply.send({ success: true, badge_active: badgeActive })
  })
}
