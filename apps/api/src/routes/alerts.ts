import { FastifyInstance } from 'fastify'
import { requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function alertRoutes(app: FastifyInstance) {

  // GET /seeker/job-alerts
  app.get('/seeker/job-alerts', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    return reply.send({ alerts: data || [] })
  })

  // POST /seeker/job-alerts
  app.post('/seeker/job-alerts', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    const { keywords, location, job_type, frequency } = request.body as any

    if (!keywords?.trim()) return reply.status(400).send({ error: 'Keywords are required' })

    const { data, error } = await supabase.from('job_alerts').insert({
      user_id: id, keywords: keywords.trim(),
      location: location || null, job_type: job_type || null,
      frequency: frequency || 'daily', is_active: true
    }).select().single()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ alert: data })
  })

  // PUT /seeker/job-alerts/:id — toggle active
  app.put('/seeker/job-alerts/:id', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id: alertId } = request.params as { id: string }
    const { id } = request.user!
    const { is_active } = request.body as { is_active: boolean }
    await supabase.from('job_alerts').update({ is_active }).eq('id', alertId).eq('user_id', id)
    return reply.send({ success: true })
  })

  // DELETE /seeker/job-alerts/:id
  app.delete('/seeker/job-alerts/:id', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id: alertId } = request.params as { id: string }
    const { id } = request.user!
    await supabase.from('job_alerts').delete().eq('id', alertId).eq('user_id', id)
    return reply.send({ success: true })
  })
}
