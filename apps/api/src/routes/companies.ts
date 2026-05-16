import { FastifyInstance } from 'fastify'
import { supabase } from '../lib/supabase.js'

export async function companyRoutes(app: FastifyInstance) {

  // GET /companies/:id — public company profile
  app.get('/companies/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const { data: company } = await supabase
      .from('profiles_employer')
      .select('*')
      .eq('id', id)
      .single()

    if (!company) return reply.status(404).send({ error: 'Company not found' })

    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', id)
      .eq('is_active', true)
      .order('posted_at', { ascending: false })
      .limit(10)

    return reply.send({ company, jobs: jobs || [] })
  })

  // GET /companies — list all verified companies
  app.get('/companies', async (_request, reply) => {
    const { data } = await supabase
      .from('profiles_employer')
      .select('id, company_name, industry, location, company_size, is_verified')
      .order('company_name')
    return reply.send({ companies: data || [] })
  })
}
