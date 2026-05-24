import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function jobsRoutes(app: FastifyInstance) {

  // GET /jobs — public search
  app.get('/jobs', async (request, reply) => {
    const { q, type, remote, level, page = '1' } = request.query as any
    const pageNum = parseInt(page) || 1
    const limit = 20
    const offset = (pageNum - 1) * limit

    let query = supabase.from('jobs').select('*', { count: 'exact' }).eq('is_active', true)

    if (q) query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%,description.ilike.%${q}%`)
    if (type) query = query.eq('job_type', type)
    if (remote === 'true') query = query.eq('is_remote', true)
    if (level) query = query.eq('experience_level', level)

    query = query.order('posted_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) return reply.status(500).send({ error: error.message })

    return reply.send({ jobs: data || [], total: count || 0, page: pageNum })
  })

  // GET /jobs/stats — real platform stats
  app.get('/jobs/stats', async (_request, reply) => {
    const { count: jobCount } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const { count: appCount } = await supabase.from('applications').select('*', { count: 'exact', head: true })
    const { count: companyCount } = await supabase.from('profiles_employer').select('*', { count: 'exact', head: true })

    return reply.send({
      jobs: jobCount || 0,
      users: userCount || 0,
      applications: appCount || 0,
      companies: companyCount || 0
    })
  })

  // GET /jobs/salary-insights
  app.get('/jobs/salary-insights', async (request, reply) => {
    const { title, location } = request.query as { title: string; location?: string }
    if (!title) return reply.status(400).send({ error: 'title is required' })

    let query = supabase.from('jobs')
      .select('salary_min, salary_max, salary_currency, title, location')
      .eq('is_active', true)
      .ilike('title', `%${title}%`)
      .not('salary_min', 'is', null)

    if (location) query = query.ilike('location', `%${location}%`)

    const { data: salaryJobs } = await query.limit(100)

    // Total matching jobs (with or without salary)
    let totalQuery = supabase.from('jobs').select('*', { count: 'exact', head: true })
      .eq('is_active', true).ilike('title', `%${title}%`)
    if (location) totalQuery = totalQuery.ilike('location', `%${location}%`)
    const { count: totalJobs } = await totalQuery

    if (!salaryJobs?.length) {
      return reply.send({ insights: null, total: totalJobs || 0 })
    }

    // Convert all to XAF for comparison (rough rates)
    const toXAF = (amount: number, currency: string) => {
      const rates: Record<string, number> = { XAF: 1, USD: 620, EUR: 670, GBP: 780 }
      return amount * (rates[currency] || 1)
    }

    const salaries = salaryJobs
      .filter(j => j.salary_min && j.salary_min > 0)
      .map(j => toXAF(j.salary_min!, j.salary_currency || 'XAF'))
      .sort((a, b) => a - b)

    if (!salaries.length) return reply.send({ insights: null, total: totalJobs || 0 })

    const min = Math.round(salaries[0])
    const max = Math.round(salaries[salaries.length - 1])
    const median = Math.round(salaries[Math.floor(salaries.length / 2)])
    const medianPct = max > min ? Math.round(((median - min) / (max - min)) * 100) : 50

    return reply.send({
      insights: {
        title,
        location: location || 'Africa',
        min, max, median, medianPct,
        jobCount: salaries.length,
        totalJobs: totalJobs || 0,
        currency: 'XAF'
      }
    })
  })

  // GET /jobs/:id
  app.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single()
    if (error || !data) return reply.status(404).send({ error: 'Job not found' })
    return reply.send({ job: data })
  })

  // POST /jobs — employer create
  app.post('/jobs', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any

    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).single()
    if (!emp) return reply.status(400).send({ error: 'Employer profile not found' })

    const { data, error } = await supabase.from('jobs').insert({
      employer_id: emp.id,
      title: body.title,
      description: body.description,
      requirements: body.requirements,
      location: body.location,
      is_remote: body.is_remote || false,
      job_type: body.job_type,
      experience_level: body.experience_level || 'any',
      salary_min: body.salary_min || null,
      salary_max: body.salary_max || null,
      salary_currency: body.salary_currency || 'XAF',
      tags: body.tags || [],
      company_name: body.company_name || body.title,
      source: 'native',
      is_active: true,
      posted_at: new Date().toISOString()
    }).select().single()

    if (error) return reply.status(500).send({ error: error.message })

    // Embed job description in background
    embedJob(data.id, `${data.title} ${data.description} ${data.requirements}`).catch(console.error)

    return reply.status(201).send({ job: data })
  })

  // PUT /jobs/:id — employer edit
  app.put('/jobs/:id', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as any

    const { data, error } = await supabase.from('jobs').update({
      title: body.title,
      description: body.description,
      requirements: body.requirements,
      location: body.location,
      is_remote: body.is_remote,
      job_type: body.job_type,
      experience_level: body.experience_level,
      salary_min: body.salary_min,
      salary_max: body.salary_max,
      salary_currency: body.salary_currency,
      is_active: body.is_active !== undefined ? body.is_active : undefined,
      tags: body.tags
    }).eq('id', id).select().single()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ job: data })
  })

  // DELETE /jobs/:id — soft delete
  app.delete('/jobs/:id', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await supabase.from('jobs').update({ is_active: false }).eq('id', id)
    return reply.send({ success: true })
  })

  // GET /seeker/feed — AI match feed
  app.get('/seeker/feed', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { page = '1' } = request.query as any
    const pageNum = parseInt(page) || 1
    const limit = 20
    const offset = (pageNum - 1) * limit

    const { data: profile } = await supabase.from('profiles_seeker').select('embedding').eq('user_id', id).single()

    if (!profile?.embedding) {
      const { data: jobs } = await supabase.from('jobs').select('*')
        .eq('is_active', true).order('posted_at', { ascending: false }).range(offset, offset + limit - 1)
      return reply.send({ jobs: jobs || [], has_embedding: false })
    }

    const { data: jobs, error } = await supabase.rpc('match_jobs', {
      query_embedding: profile.embedding,
      match_count: limit,
      match_offset: offset
    })

    if (error) {
      const { data: fallback } = await supabase.from('jobs').select('*')
        .eq('is_active', true).order('posted_at', { ascending: false }).range(offset, offset + limit - 1)
      return reply.send({ jobs: fallback || [], has_embedding: true })
    }

    return reply.send({ jobs: jobs || [], has_embedding: true })
  })
}

async function embedJob(jobId: string, text: string) {
  try {
    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text.slice(0, 8000) })
    await supabase.from('jobs').update({ embedding: res.data[0].embedding as any }).eq('id', jobId)
  } catch (e) { console.error('Job embed failed:', e) }
}
