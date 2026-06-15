import { FastifyInstance } from 'fastify'
import { requireRole } from '../middleware/authenticate.js'
import { sendStatusUpdateEmail } from '../services/email.js'
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

    const { data: existing } = await supabase.from('profiles_employer').select('id').eq('user_id', id).single()

    let profile
    if (existing) {
      const { data } = await supabase.from('profiles_employer')
        .update({ company_name: body.company_name, industry: body.industry, company_size: body.company_size,
          location: body.location, website: body.website, description: body.description })
        .eq('user_id', id).select().single()
      profile = data
    } else {
      const { data } = await supabase.from('profiles_employer')
        .insert({ user_id: id, company_name: body.company_name, industry: body.industry,
          company_size: body.company_size, location: body.location, website: body.website, description: body.description })
        .select().single()
      profile = data
    }
    return reply.send({ profile })
  })

  // GET /employer/jobs
  app.get('/employer/jobs', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).single()
    if (!emp) return reply.send({ jobs: [] })

    const { data: jobs } = await supabase.from('jobs')
      .select('*, applications(count)')
      .eq('employer_id', emp.id)
      .order('created_at', { ascending: false })

    return reply.send({ jobs: jobs || [] })
  })

  // GET /employer/jobs/:jobId/candidates
  app.get('/employer/jobs/:jobId/candidates', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string }

    const { data: candidates } = await supabase
      .from('applications')
      .select('*, profiles_seeker(*, seeker_skills(*, skills(*)))')
      .eq('job_id', jobId)
      .order('ai_match_score', { ascending: false })

    return reply.send({ candidates: candidates || [] })
  })

  // PUT /employer/applications/:appId/status
  app.put('/employer/applications/:appId/status', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { appId } = request.params as { appId: string }
    const { status } = request.body as { status: string }

    const VALID = ['applied', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected']
    if (!VALID.includes(status)) return reply.status(400).send({ error: 'Invalid status' })

    try {
      // Step 1: Update status
      const { data, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', appId)
        .select()
        .single()

      if (error) {
        console.error('[Status] DB error:', error.message)
        return reply.status(500).send({ error: error.message })
      }

      // Step 2: Notify seeker — separate queries to avoid join complexity
      try {
        const { data: appDetail } = await supabase
          .from('applications')
          .select('seeker_id, job_id')
          .eq('id', appId)
          .single()

        if (appDetail?.seeker_id) {
          const [seekerRes, jobRes] = await Promise.all([
            supabase.from('profiles_seeker').select('user_id').eq('id', appDetail.seeker_id).single(),
            supabase.from('jobs').select('title, company_name').eq('id', appDetail.job_id).single()
          ])

          const seekerUserId = seekerRes.data?.user_id
          const jobTitle = jobRes.data?.title || 'the position'
          const companyName = jobRes.data?.company_name || 'The employer'

          const messages: Record<string, { title: string; message: string; type: string }> = {
            viewed:      { type: 'application', title: 'Application Viewed 👀',      message: `${companyName} viewed your application for ${jobTitle}` },
            shortlisted: { type: 'shortlisted', title: "You're Shortlisted! 🌟",    message: `Great news! ${companyName} shortlisted you for ${jobTitle}. Stay ready!` },
            interview:   { type: 'interview',   title: 'Interview Invitation 🎯',    message: `${companyName} wants to interview you for ${jobTitle}! Check your applications for next steps.` },
            offered:     { type: 'offered',     title: 'Job Offer Received! 🎉',     message: `Congratulations! ${companyName} made you an offer for ${jobTitle}. Log in to review it!` },
            rejected:    { type: 'application', title: 'Application Status Update',  message: `${companyName} has reviewed your application for ${jobTitle}.` },
          }

          const notif = messages[status]
          if (notif && seekerUserId) {
            Promise.resolve(
              supabase.from('notifications').insert({
                user_id: seekerUserId,
                type:    notif.type,
                title:   notif.title,
                message: notif.message,
                is_read: false,
                metadata: JSON.stringify({ job_title: jobTitle, company_name: companyName, status })
              })
            ).catch(e => console.error('[Notif] Failed:', e.message))
          }
        }
      } catch (e) {
        console.error('[Notif] Error (non-fatal):', e)
      }

      // Send email notification (non-blocking)
      try {
        const { data: seekerUser } = await supabase.from('users').select('email').eq('id', seekerProfile?.user_id).single()
        if (seekerUser?.email) {
          sendStatusUpdateEmail(seekerUser.email, seekerProfile?.full_name || '', jobTitle, companyName, status).catch(() => {})
        }
      } catch {}

      return reply.send({ application: data })
    } catch (e: any) {
      console.error('[Status] Unhandled:', e.message)
      return reply.status(500).send({ error: e.message })
    }
  })

  // POST /employer/verification-request
  app.post('/employer/verification-request', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any

    // Store verification request in notifications table for admin review
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'application',
      title: '⏳ Verification Under Review',
      message: `Your verification request for ${body.company_name} has been submitted and is under review. We'll notify you within 2-3 business days.`,
      is_read: false
    })

    // Log for admin (could send email to admin too)
    console.log('[Verification Request]', { user_id: id, ...body })

    return reply.status(201).send({ success: true, message: 'Verification request submitted' })
  })

  // GET /employer/analytics
  app.get('/employer/analytics', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { id } = request.user!
    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).single()
    if (!emp) return reply.send({ activeJobs: 0, totalApplicants: 0, totalJobs: 0, pipeline: {} })

    const { data: jobs } = await supabase.from('jobs').select('id, is_active').eq('employer_id', emp.id)
    const jobIds = (jobs || []).map(j => j.id)
    const activeJobs = (jobs || []).filter(j => j.is_active).length
    const totalJobs = (jobs || []).length

    let totalApplicants = 0
    let avgScore = null
    const pipeline: Record<string, number> = {}

    if (jobIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications').select('status, ai_match_score').in('job_id', jobIds)

      totalApplicants = apps?.length || 0
      apps?.forEach(a => { pipeline[a.status] = (pipeline[a.status] || 0) + 1 })

      const scored = (apps || []).filter(a => a.ai_match_score)
      if (scored.length > 0) {
        avgScore = Math.round(scored.reduce((s, a) => s + a.ai_match_score, 0) / scored.length)
      }
    }

    return reply.send({ activeJobs, totalApplicants, totalJobs, avgScore, pipeline })
  })
}
