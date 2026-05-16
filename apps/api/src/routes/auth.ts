import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function authRoutes(app: FastifyInstance) {

  // GET /auth/me — upsert user + return profile
  app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const { id, email, role } = request.user!

    // Upsert user record
    const { data: user } = await supabase.from('users')
      .upsert({ id, email, role, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      .select().single()

    // Load profile based on role
    let profile = null
    if (role === 'employer') {
      const { data } = await supabase.from('profiles_employer').select('*').eq('user_id', id).single()
      profile = data
    } else {
      const { data } = await supabase.from('profiles_seeker')
        .select('*, seeker_skills(*, skills(*))')
        .eq('user_id', id).single()
      profile = data
    }

    return reply.send({ user: user || { id, email, role, lang_preference: 'en' }, profile })
  })

  // PUT /auth/language
  app.put('/auth/language', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { lang } = request.body as { lang: string }
    await supabase.from('users').update({ lang_preference: lang }).eq('id', id)
    return reply.send({ success: true })
  })
}
