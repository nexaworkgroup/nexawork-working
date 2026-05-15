import { FastifyInstance } from 'fastify'
import { requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function employerRoutes(app: FastifyInstance) {
  // GET /employer/profile
  app.get('/employer/profile', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase.from('profiles_employer').select('*').eq('user_id', id).single()
    return reply.send({ profile: data })
  })

  // PUT /employer/profile
  app.put('/employer/profile', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any
    const { data, error } = await supabase
      .from('profiles_employer')
      .update({
        company_name: body.company_name,
        industry: body.industry,
        company_size: body.company_size,
        location: body.location,
        website: body.website,
        description: body.description
      })
      .eq('user_id', id)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ profile: data })
  })

  // GET /employer/jobs — employer's own job listings
  app.get('/employer/jobs', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).single()

    const { data } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('employer_id', emp!.id)
      .order('created_at', { ascending: false })

    return reply.send({ jobs: data })
  })

  // GET /employer/jobs/:jobId/candidates — applicants ranked by match score
  app.get('/employer/jobs/:jobId/candidates', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string }

    const { data } = await supabase
      .from('applications')
      .select('*, profiles_seeker(full_name, location, degree, field_of_study, institution, avatar_url, cv_url, profile_strength, seeker_skills(skills(name, category)))')
      .eq('job_id', jobId)
      .order('ai_match_score', { ascending: false })

    return reply.send({ candidates: data })
  })

  // PUT /employer/applications/:appId/status — update application status (ATS)
  app.put('/employer/applications/:appId/status', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { appId } = request.params as { appId: string }
    const { status } = request.body as { status: string }

    const validStatuses = ['applied', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected']
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: 'Invalid status' })
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId)
      .select()
      .single()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ application: data })
  })

  // GET /employer/analytics
  app.get('/employer/analytics', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).single()

    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, is_active')
      .eq('employer_id', emp!.id)

    const jobIds = (jobs || []).map(j => j.id)

    const { data: apps } = await supabase
      .from('applications')
      .select('status, ai_match_score, job_id')
      .in('job_id', jobIds)

    const totalJobs = jobs?.length ?? 0
    const activeJobs = jobs?.filter(j => j.is_active).length ?? 0
    const totalApplicants = apps?.length ?? 0
    const avgScore = apps?.length
      ? Math.round(apps.reduce((s, a) => s + (a.ai_match_score ?? 0), 0) / apps.length)
      : 0

    const pipeline = {
      applied: 0, viewed: 0, shortlisted: 0,
      interview: 0, offered: 0, rejected: 0
    }
    apps?.forEach(a => { if (a.status in pipeline) (pipeline as any)[a.status]++ })

    return reply.send({ totalJobs, activeJobs, totalApplicants, avgScore, pipeline })
  })
}
