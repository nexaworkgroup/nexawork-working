import { FastifyInstance } from 'fastify'
import { supabase } from '../lib/supabase.js'
import { runAggregationPipeline, expireOldJobs } from '../services/scraper/pipeline.js'
import { embedMissingJobs } from '../services/scraper/embedder.js'
import { authenticate } from '../middleware/authenticate.js'

// Simple admin token check (set ADMIN_SECRET in .env)
async function requireAdmin(request: any, reply: any) {
  const token = request.headers['x-admin-token']
  const secret = process.env.ADMIN_SECRET

  // If no secret set, fall back to authenticated users only in dev
  if (!secret) {
    await authenticate(request, reply)
    return
  }

  if (token !== secret) {
    return reply.status(403).send({ error: 'Invalid admin token' })
  }
}

export async function adminRoutes(app: FastifyInstance) {

  // POST /admin/scrape — trigger full pipeline manually
  app.post('/admin/scrape', { preHandler: requireAdmin }, async (request, reply) => {
    const { sources, seed_only } = (request.body as any) || {}

    // Run async — don't block the HTTP response
    runAggregationPipeline({
      sources: sources || ['all'],
      seedOnly: seed_only || false
    }).catch(console.error)

    return reply.send({
      message: 'Aggregation pipeline started',
      sources: sources || ['all'],
      tip: 'Check server logs for progress. Results available in /admin/stats'
    })
  })

  // POST /admin/embed — re-embed all jobs missing embeddings
  app.post('/admin/embed', { preHandler: requireAdmin }, async (_req, reply) => {
    embedMissingJobs().catch(console.error)
    return reply.send({ message: 'Embedding job started — check server logs' })
  })

  // POST /admin/expire — manually expire old jobs
  app.post('/admin/expire', { preHandler: requireAdmin }, async (_req, reply) => {
    const count = await expireOldJobs()
    return reply.send({ expired: count })
  })

  // GET /admin/stats — database overview
  app.get('/admin/stats', { preHandler: requireAdmin }, async (_req, reply) => {
    const [
      { count: totalJobs },
      { count: activeJobs },
      { count: embeddedJobs },
      { count: totalUsers },
      { count: totalApps },
    ] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).not('embedding', 'is', null),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
    ])

    // Jobs by source
    const { data: sourceBreakdown } = await supabase
      .from('jobs')
      .select('source')
      .eq('is_active', true)

    const bySource = (sourceBreakdown || []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.source] = (acc[row.source] || 0) + 1
      return acc
    }, {})

    return reply.send({
      jobs: { total: totalJobs, active: activeJobs, embedded: embeddedJobs, missing_embeddings: (activeJobs || 0) - (embeddedJobs || 0) },
      users: totalUsers,
      applications: totalApps,
      jobs_by_source: bySource
    })
  })

  // GET /admin/jobs — list jobs with filters
  app.get('/admin/jobs', { preHandler: requireAdmin }, async (request, reply) => {
    const { source, active, page = '1' } = request.query as any
    const limit = 50
    const offset = (parseInt(page) - 1) * limit

    let query = supabase
      .from('jobs')
      .select('id, title, company_name, source, is_active, posted_at, embedding')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (source) query = query.eq('source', source)
    if (active !== undefined) query = query.eq('is_active', active === 'true')

    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })

    return reply.send({
      jobs: (data || []).map(j => ({ ...j, has_embedding: !!j.embedding })),
      page: parseInt(page)
    })
  })

  // DELETE /admin/jobs/:id — hard delete a job
  app.delete('/admin/jobs/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as any
    await supabase.from('jobs').delete().eq('id', id)
    return reply.send({ deleted: id })
  })
}
