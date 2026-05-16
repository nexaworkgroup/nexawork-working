import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function notificationRoutes(app: FastifyInstance) {
  // GET /notifications
  app.get('/notifications', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
    return reply.send({ notifications: data || [] })
  })

  // GET /notifications/unread-count
  app.get('/notifications/unread-count', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('is_read', false)
    return reply.send({ count: count || 0 })
  })

  // PUT /notifications/read-all
  app.put('/notifications/read-all', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', id)
    return reply.send({ success: true })
  })

  // PUT /notifications/:id/read
  app.put('/notifications/:id/read', { preHandler: authenticate }, async (request, reply) => {
    const { id: notifId } = request.params as { id: string }
    const { id } = request.user!
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId).eq('user_id', id)
    return reply.send({ success: true })
  })
}
