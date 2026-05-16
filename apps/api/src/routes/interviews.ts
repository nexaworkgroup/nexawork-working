import { FastifyInstance } from 'fastify'
import { requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function interviewRoutes(app: FastifyInstance) {

  // POST /employer/interviews
  app.post('/employer/interviews', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id: employerId } = request.user!
    const body = request.body as any

    if (!body.application_id) return reply.status(400).send({ error: 'application_id is required' })
    if (!body.scheduled_at)   return reply.status(400).send({ error: 'scheduled_at is required' })

    try {
      const { data: application, error: appErr } = await supabase
        .from('applications').select('id, seeker_id, job_id').eq('id', body.application_id).single()
      if (appErr || !application) return reply.status(404).send({ error: 'Application not found' })

      const { data: seekerProfile } = await supabase
        .from('profiles_seeker').select('user_id, full_name').eq('id', application.seeker_id).single()

      const { data: job } = await supabase
        .from('jobs').select('title, company_name').eq('id', application.job_id).single()

      const seekerUserId = seekerProfile?.user_id

      const { data: interview, error: ivErr } = await supabase
        .from('interviews')
        .insert({
          application_id: body.application_id,
          employer_id: employerId,
          seeker_id: seekerUserId,
          job_id: application.job_id,
          scheduled_at: body.scheduled_at,
          duration_minutes: body.duration_minutes || 30,
          type: body.type || 'video',
          location: body.location || null,
          notes: body.notes || null,
          status: 'scheduled'
        }).select().single()

      if (ivErr) {
        console.error('[Interview] Insert error:', ivErr.message)
        return reply.status(500).send({ error: ivErr.message })
      }

      // Non-blocking updates
      Promise.resolve(supabase.from('applications').update({ status: 'interview' }).eq('id', body.application_id))
        .catch(e => console.error('[Interview] Status update failed:', e))

      if (seekerUserId) {
        const dateStr = new Date(body.scheduled_at).toLocaleString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
        })
        Promise.resolve(supabase.from('notifications').insert({
          user_id: seekerUserId, type: 'status',
          title: '🎯 Interview Scheduled!',
          message: `${job?.company_name} scheduled a ${(body.type || 'video').replace('_', ' ')} interview for ${job?.title} on ${dateStr}.`,
          is_read: false
        })).catch(e => console.error('[Interview] Notification failed:', e))
      }

      return reply.status(201).send({ interview })
    } catch (e: any) {
      console.error('[Interview] Error:', e.message)
      return reply.status(500).send({ error: e.message })
    }
  })

  // GET /seeker/interviews
  app.get('/seeker/interviews', { preHandler: requireRole('job_seeker') }, async (request, reply) => {
    const { id } = request.user!
    try {
      // seeker_id in interviews stores the auth user_id (not profiles_seeker.id)
      const { data, error } = await supabase
        .from('interviews')
        .select('*, jobs(title, company_name)')
        .eq('seeker_id', id)
        .order('scheduled_at', { ascending: true })

      console.log('[Seeker interviews] user:', id, 'found:', data?.length, error?.message)
      return reply.send({ interviews: data || [] })
    } catch (e: any) {
      return reply.send({ interviews: [] })
    }
  })

  // GET /employer/interviews
  app.get('/employer/interviews', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*, jobs(title, company_name)')
        .eq('employer_id', id)
        .order('scheduled_at', { ascending: true })

      console.log('[Employer interviews] user:', id, 'found:', data?.length, error?.message)

      // Enrich with seeker names separately
      if (data && data.length > 0) {
        const seekerIds = [...new Set(data.map((i: any) => i.seeker_id).filter(Boolean))]
        const { data: seekers } = await supabase
          .from('profiles_seeker')
          .select('user_id, full_name')
          .in('user_id', seekerIds)

        const seekerMap = Object.fromEntries((seekers || []).map(s => [s.user_id, s]))

        const enriched = data.map((iv: any) => ({
          ...iv,
          profiles_seeker: seekerMap[iv.seeker_id] || null
        }))
        return reply.send({ interviews: enriched })
      }

      return reply.send({ interviews: data || [] })
    } catch (e: any) {
      console.error('[Employer interviews] Error:', e.message)
      return reply.send({ interviews: [] })
    }
  })

  // PUT /employer/interviews/:id
  app.put('/employer/interviews/:id', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id: ivId } = request.params as { id: string }
    const { status } = request.body as { status: string }
    await supabase.from('interviews').update({ status }).eq('id', ivId)
    return reply.send({ success: true })
  })
}
