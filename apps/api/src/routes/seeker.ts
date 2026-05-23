import { FastifyInstance } from 'fastify'
import { requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'
import OpenAI from 'openai'
import { sendApplicationConfirmation } from '../services/email.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function getOrCreateSeekerProfile(userId: string) {
  try {
    const { data: existing } = await supabase
      .from('profiles_seeker').select('*').eq('user_id', userId).single()
    if (existing) return existing

    const { data: created, error } = await supabase
      .from('profiles_seeker')
      .insert({ user_id: userId, full_name: '' })
      .select().single()

    if (error) { console.error('[getOrCreateSeekerProfile]', error.message); return null }
    return created
  } catch (e) {
    console.error('[getOrCreateSeekerProfile]', e)
    return null
  }
}

// Fire-and-forget helper that works with Supabase PromiseLike
function fireAndForget(query: PromiseLike<any>) {
  Promise.resolve(query).catch(() => {})
}

export async function seekerRoutes(app: FastifyInstance) {

  // GET /seeker/profile
  app.get('/seeker/profile', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const profile = await getOrCreateSeekerProfile(id)
    if (!profile) return reply.status(500).send({ error: 'Could not load profile' })
    const { data: skills } = await supabase
      .from('seeker_skills').select('*, skills(*)').eq('seeker_id', profile.id)
    return reply.send({ profile: { ...profile, seeker_skills: skills || [] } })
  })

  // PUT /seeker/profile
  app.put('/seeker/profile', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any
    const existing = await getOrCreateSeekerProfile(id)
    if (!existing) return reply.status(500).send({ error: 'Could not create profile' })

    const { data, error } = await supabase
      .from('profiles_seeker')
      .update({
        full_name: body.full_name,
        location: body.location,
        degree: body.degree,
        field_of_study: body.field_of_study,
        institution: body.institution,
        graduation_year: body.graduation_year,
        bio: body.bio,
        is_open_to_work: body.is_open_to_work,
        profile_strength: computeProfileStrength(body)
      })
      .eq('user_id', id).select().single()

    if (error) return reply.status(500).send({ error: error.message })

    if (body.skill_ids?.length) {
      await supabase.from('seeker_skills').delete().eq('seeker_id', existing.id)
      await supabase.from('seeker_skills').insert(
        body.skill_ids.map((skillId: string) => ({ seeker_id: existing.id, skill_id: skillId }))
      )
    }

    embedSeekerProfile(id, data).catch(console.error)
    return reply.send({ profile: data })
  })

  // GET /seeker/applications
  app.get('/seeker/applications', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const profile = await getOrCreateSeekerProfile(id)
    if (!profile) return reply.send({ applications: [] })
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(title, company_name, location, job_type, is_remote)')
      .eq('seeker_id', profile.id)
      .order('created_at', { ascending: false })
    return reply.send({ applications: data || [] })
  })

  // POST /applications
  app.post('/applications', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const { job_id, cover_letter } = request.body as { job_id: string; cover_letter?: string }

    console.log(`[Apply] User ${id} → job ${job_id}`)
    if (!job_id) return reply.status(400).send({ error: 'job_id is required' })

    try {
      const profile = await getOrCreateSeekerProfile(id)
      if (!profile) return reply.status(500).send({ error: 'Could not create your profile' })
      console.log(`[Apply] Profile: ${profile.id}`)

      // Verify job exists
      const { data: job, error: jobError } = await supabase
        .from('jobs').select('id').eq('id', job_id).single()
      if (jobError || !job) {
        console.error('[Apply] Job not found:', jobError?.message)
        return reply.status(404).send({ error: 'Job not found' })
      }
      console.log(`[Apply] Job OK: ${job.id}`)

      // Insert application
      const { data, error } = await supabase
        .from('applications')
        .insert({ seeker_id: profile.id, job_id, cover_letter: cover_letter || null, ai_match_score: null })
        .select().single()

      if (error) {
        console.error('[Apply] DB error:', error.code, error.message)
        if (error.code === '23505') return reply.status(409).send({ error: 'Already applied to this job' })
        return reply.status(500).send({ error: error.message })
      }

      // Track view — fire and forget using helper
      fireAndForget(supabase.from('job_views').insert({ seeker_id: profile.id, job_id }))

      console.log(`[Apply] ✅ Done — ${data.id}`)
      return reply.status(201).send({ application: data })
    } catch (e: any) {
      console.error('[Apply] UNHANDLED:', e.message)
      return reply.status(500).send({ error: e.message || 'Application failed' })
    }
  })

  // GET /seeker/saved-jobs
  app.get('/seeker/saved-jobs', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const profile = await getOrCreateSeekerProfile(id)
    if (!profile) return reply.send({ saved_jobs: [] })
    const { data } = await supabase
      .from('saved_jobs').select('*, jobs(*)')
      .eq('seeker_id', profile.id).order('created_at', { ascending: false })
    return reply.send({ saved_jobs: data || [] })
  })

  // POST /seeker/saved-jobs/:jobId
  app.post('/seeker/saved-jobs/:jobId', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    const { id } = request.user!
    const profile = await getOrCreateSeekerProfile(id)
    if (!profile) return reply.status(500).send({ error: 'Profile not found' })
    fireAndForget(supabase.from('saved_jobs').insert({ seeker_id: profile.id, job_id: jobId }))
    return reply.send({ success: true })
  })

  // DELETE /seeker/saved-jobs/:jobId
  app.delete('/seeker/saved-jobs/:jobId', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    const { id } = request.user!
    const profile = await getOrCreateSeekerProfile(id)
    if (!profile) return reply.status(500).send({ error: 'Profile not found' })
    await supabase.from('saved_jobs').delete().eq('seeker_id', profile.id).eq('job_id', jobId)
    return reply.send({ success: true })
  })


  // DELETE /applications/:appId — withdraw application
  app.delete('/applications/:appId', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { appId } = request.params as { appId: string }
    const { id } = request.user!
    const profile = await getOrCreateSeekerProfile(id)
    if (!profile) return reply.status(404).send({ error: 'Profile not found' })

    // Only allow withdrawal if status is applied or viewed
    const { data: app } = await supabase
      .from('applications').select('status, seeker_id').eq('id', appId).single()

    if (!app) return reply.status(404).send({ error: 'Application not found' })
    if (app.seeker_id !== profile.id) return reply.status(403).send({ error: 'Not your application' })
    if (!['applied', 'viewed'].includes(app.status)) {
      return reply.status(400).send({ error: 'Cannot withdraw — application is already in progress' })
    }

    await supabase.from('applications').delete().eq('id', appId)
    console.log('[Withdraw] Application', appId, 'withdrawn by', id)
    return reply.send({ success: true })
  })
  // GET /skills
  app.get('/skills', async (_request, reply) => {
    const { data } = await supabase.from('skills').select('*').order('category').order('name')
    return reply.send({ skills: data || [] })
  })
}

function computeProfileStrength(profile: any): number {
  const fields = [profile.full_name, profile.location, profile.degree,
    profile.field_of_study, profile.institution, profile.bio, profile.graduation_year]
  const filled = fields.filter(Boolean).length
  const hasSkills = profile.skill_ids?.length > 0
  return Math.min(100, Math.round((filled / fields.length) * 80) + (hasSkills ? 20 : 0))
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  return magA && magB ? Math.round((dot / (magA * magB)) * 100) : 0
}

async function embedSeekerProfile(userId: string, profile: any) {
  try {
    const text = [profile.full_name, profile.location, profile.degree,
      profile.field_of_study, profile.institution, profile.bio].filter(Boolean).join(' ')
    if (!text.trim()) return
    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
    await supabase.from('profiles_seeker')
      .update({ embedding: res.data[0].embedding as any }).eq('user_id', userId)
  } catch (e) { console.error('Seeker embedding failed:', e) }
}

// DELETE /applications/:appId — withdraw application
