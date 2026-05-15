import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function authRoutes(app: FastifyInstance) {
  // GET /auth/me — returns current user + profile
  app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const { id, role } = request.user!

    let profile = null
    if (role === 'job_seeker') {
      const { data } = await supabase
        .from('profiles_seeker')
        .select('*')
        .eq('user_id', id)
        .single()
      profile = data
    } else if (role === 'employer') {
      const { data } = await supabase
        .from('profiles_employer')
        .select('*')
        .eq('user_id', id)
        .single()
      profile = data
    }

    return reply.send({ user: request.user, profile })
  })

  // PUT /auth/language — update language preference
  app.put('/auth/language', { preHandler: authenticate }, async (request, reply) => {
    const { lang } = request.body as { lang: 'en' | 'fr' }
    if (!['en', 'fr'].includes(lang)) {
      return reply.status(400).send({ error: 'Language must be en or fr' })
    }

    const { error } = await supabase
      .from('users')
      .update({ lang_preference: lang })
      .eq('id', request.user!.id)

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ success: true, lang })
  })
}
