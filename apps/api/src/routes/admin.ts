import { FastifyInstance } from 'fastify'
import { supabase } from '../lib/supabase.js'
import { runAggregationPipeline } from '../services/scraper/pipeline.js'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'nexawork2026admin'

async function adminAuth(request: any, reply: any) {
  const secret = request.headers['x-admin-secret']
  if (secret !== ADMIN_SECRET) {
    return reply.status(403).send({ error: 'Forbidden' })
  }
}

export async function adminRoutes(app: FastifyInstance) {

  // GET /admin/stats — full platform stats
  app.get('/admin/stats', { preHandler: adminAuth }, async (_request, reply) => {
    try {
      // Run each query independently so one failure doesn't break everything
      const safeCount = async (query: any) => {
        try { const r = await query; return r.count || 0 } catch { return 0 }
      }

      const [totalJobs, activeJobs, totalUsers, seekers, employers, applications] = await Promise.all([
        safeCount(supabase.from('jobs').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true)),
        safeCount(supabase.from('users').select('*', { count: 'exact', head: true })),
        safeCount(supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'job_seeker')),
        safeCount(supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'employer')),
        safeCount(supabase.from('applications').select('*', { count: 'exact', head: true })),
      ])

      const embeddedJobs = await safeCount(
        supabase.from('jobs').select('*', { count: 'exact', head: true }).not('embedding', 'is', null)
      )

      // Interviews — may not exist yet
      let interviews = 0
      try {
        const { count } = await supabase.from('interviews').select('*', { count: 'exact', head: true })
        interviews = count || 0
      } catch { interviews = 0 }

      // Jobs by source
      let bySource: Record<string, number> = {}
      try {
        const { data: sourceData } = await supabase.from('jobs').select('source')
        sourceData?.forEach((j: any) => {
          const src = j.source || 'unknown'
          bySource[src] = (bySource[src] || 0) + 1
        })
      } catch {}

      return reply.send({
        totalJobs, activeJobs, totalUsers, seekers, employers,
        applications, interviews, embeddedJobs, bySource
      })
    } catch (e: any) {
      console.error('[Admin stats] Error:', e.message)
      return reply.status(500).send({ error: e.message })
    }
  })

  // GET /admin/jobs
  app.get('/admin/jobs', { preHandler: adminAuth }, async (request, reply) => {
    const { page = '1', q } = request.query as any
    const pageNum = parseInt(page)
    const limit = 50

    let query = supabase.from('jobs')
      .select('id, title, company_name, source, is_active, created_at, embedding', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limit, pageNum * limit - 1)

    if (q) query = query.ilike('title', `%${q}%`)

    const { data: jobs, count } = await query
    return reply.send({ jobs: (jobs || []).map(j => ({ ...j, embedding: !!j.embedding })), total: count || 0 })
  })

  // DELETE /admin/jobs/:id
  app.delete('/admin/jobs/:id', { preHandler: adminAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await supabase.from('jobs').delete().eq('id', id)
    return reply.send({ success: true })
  })

  // GET /admin/users
  app.get('/admin/users', { preHandler: adminAuth }, async (_request, reply) => {
    const { data: users, count } = await supabase
      .from('users')
      .select('id, email, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100)

    // Enrich with profile names
    const seekerIds = (users || []).filter(u => u.role === 'job_seeker').map(u => u.id)
    const employerIds = (users || []).filter(u => u.role === 'employer').map(u => u.id)

    const [{ data: seekers }, { data: emps }] = await Promise.all([
      supabase.from('profiles_seeker').select('user_id, full_name').in('user_id', seekerIds),
      supabase.from('profiles_employer').select('user_id, company_name').in('user_id', employerIds),
    ])

    const nameMap: Record<string, string> = {}
    seekers?.forEach(s => { nameMap[s.user_id] = s.full_name })
    emps?.forEach(e => { nameMap[e.user_id] = e.company_name })

    const enriched = (users || []).map(u => ({ ...u, profile_name: nameMap[u.id] || null }))
    return reply.send({ users: enriched, total: count || 0 })
  })

  // POST /admin/scrape — trigger scraper
  app.post('/admin/scrape', { preHandler: adminAuth }, async (request, reply) => {
    const { sources = 'all' } = request.body as any
    try {
      const result = await runAggregationPipeline({ sources, seedOnly: sources === 'seeds' })
      return reply.send({ success: true, inserted: result.total_inserted, fetched: result.total_fetched, embedded: result.total_embedded })
    } catch (e: any) {
      return reply.status(500).send({ error: e.message })
    }
  })

  // POST /admin/embed — embed jobs without embeddings
  app.post('/admin/embed', { preHandler: adminAuth }, async (_request, reply) => {
    const { data: jobs } = await supabase
      .from('jobs').select('id, title, description, requirements')
      .is('embedding', null).limit(50)

    if (!jobs?.length) return reply.send({ embedded: 0, message: 'All jobs already embedded' })

    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let embedded = 0
    for (const job of jobs) {
      try {
        const text = [job.title, job.description, job.requirements].filter(Boolean).join(' ').slice(0, 8000)
        const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
        await supabase.from('jobs').update({ embedding: res.data[0].embedding as any }).eq('id', job.id)
        embedded++
      } catch (e) { console.error('Embed failed for', job.id) }
    }

    return reply.send({ embedded, total: jobs.length })
  })
}
