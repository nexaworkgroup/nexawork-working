import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function jobsRoutes(app: FastifyInstance) {
  // GET /jobs — search & filter (public)
  app.get('/jobs', async (request, reply) => {
    const { q, location, type, remote, level, page = '1' } = request.query as Record<string, string>
    const pageNum = parseInt(page)
    const limit = 20
    const offset = (pageNum - 1) * limit

    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('posted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (q) query = query.ilike('title', `%${q}%`)
    if (location) query = query.ilike('location', `%${location}%`)
    if (type) query = query.eq('job_type', type)
    if (remote === 'true') query = query.eq('is_remote', true)
    if (level) query = query.eq('experience_level', level)

    const { data, error, count } = await query
    if (error) return reply.status(500).send({ error: error.message })

    return reply.send({ jobs: data, total: count, page: pageNum, limit })
  })

  // GET /jobs/:id — single job detail (public)
  app.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) return reply.status(404).send({ error: 'Job not found' })
    return reply.send({ job: data })
  })

  // GET /seeker/feed — personalised match feed
  app.get('/seeker/feed', { preHandler: authenticate }, async (request, reply) => {
    const { id, role } = request.user!
    if (role !== 'job_seeker') return reply.status(403).send({ error: 'Job seekers only' })

    const { page = '1' } = request.query as { page?: string }
    const pageNum = parseInt(page)
    const limit = 20
    const offset = (pageNum - 1) * limit

    // Get seeker's embedding
    const { data: profile } = await supabase
      .from('profiles_seeker')
      .select('embedding, location, field_of_study')
      .eq('user_id', id)
      .single()

    if (!profile?.embedding) {
      // No embedding yet — return recent entry-level jobs in their region
      const { data: fallback } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .in('experience_level', ['entry', 'any'])
        .order('posted_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return reply.send({
        jobs: (fallback || []).map(j => ({ ...j, match_score: 0 })),
        has_embedding: false,
        page: pageNum
      })
    }

    // Vector similarity search using pgvector
    const embeddingStr = JSON.stringify(profile.embedding)
    const { data: matches, error } = await supabase.rpc('match_jobs', {
      query_embedding: embeddingStr,
      match_count: limit,
      match_offset: offset
    })

    if (error) {
      // Fallback to recency if RPC not available
      const { data: fallback } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('posted_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return reply.send({
        jobs: (fallback || []).map(j => ({ ...j, match_score: 0 })),
        has_embedding: true,
        page: pageNum
      })
    }

    return reply.send({ jobs: matches || [], has_embedding: true, page: pageNum })
  })

  // POST /jobs — create job (employers only)
  app.post('/jobs', { preHandler: requireRole('employer') }, async (request, reply) => {
    const body = request.body as any
    const { id } = request.user!

    const { data: employer } = await supabase
      .from('profiles_employer')
      .select('id, company_name')
      .eq('user_id', id)
      .single()

    if (!employer) return reply.status(400).send({ error: 'Employer profile not found' })

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        employer_id: employer.id,
        source: 'native',
        title: body.title,
        company_name: employer.company_name,
        location: body.location,
        is_remote: body.is_remote ?? false,
        job_type: body.job_type,
        experience_level: body.experience_level ?? 'any',
        description: body.description,
        requirements: body.requirements,
        salary_min: body.salary_min,
        salary_max: body.salary_max,
        salary_currency: body.salary_currency ?? 'XAF',
        tags: body.tags ?? []
      })
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })

    // Trigger embedding generation asynchronously
    embedJob(data.id, body.title, body.description, body.requirements).catch(console.error)

    return reply.status(201).send({ job: data })
  })

  // PUT /jobs/:id — update job (employer owner)
  app.put('/jobs/:id', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id: jobId } = request.params as { id: string }
    const body = request.body as any
    const { id: userId } = request.user!

    const { data: employer } = await supabase
      .from('profiles_employer')
      .select('id')
      .eq('user_id', userId)
      .single()

    const { data, error } = await supabase
      .from('jobs')
      .update(body)
      .eq('id', jobId)
      .eq('employer_id', employer?.id)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ job: data })
  })

  // DELETE /jobs/:id — deactivate (soft delete)
  app.delete('/jobs/:id', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id: jobId } = request.params as { id: string }
    const { id: userId } = request.user!

    const { data: employer } = await supabase
      .from('profiles_employer')
      .select('id')
      .eq('user_id', userId)
      .single()

    await supabase
      .from('jobs')
      .update({ is_active: false })
      .eq('id', jobId)
      .eq('employer_id', employer?.id)

    return reply.send({ success: true })
  })
}

// Helper: generate and store embedding for a job
async function embedJob(jobId: string, title: string, description = '', requirements = '') {
  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const text = `${title} ${description} ${requirements}`.slice(0, 8000)
    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
    const embedding = res.data[0].embedding
    await supabase.from('jobs').update({ embedding: embedding as any }).eq('id', jobId)
  } catch (e) {
    console.error('Job embedding failed:', e)
  }
}
