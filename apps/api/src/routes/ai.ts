import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function aiRoutes(app: FastifyInstance) {

  // POST /ai/chat — streaming chatbot with function calling
  app.post('/ai/chat', { preHandler: authenticate }, async (request, reply) => {
    const { message, history = [] } = request.body as {
      message: string
      history: Array<{ role: 'user' | 'assistant'; content: string }>
    }
    const { id, role } = request.user!

    // Build user context
    let userContext = ''
    if (role === 'job_seeker') {
      const { data: p } = await supabase
        .from('profiles_seeker')
        .select('full_name, location, degree, field_of_study, profile_strength, seeker_skills(skills(name))')
        .eq('user_id', id)
        .single()
      if (p) {
        const skills = (p.seeker_skills as any[])?.map((s: any) => s.skills?.name).join(', ') || 'none yet'
        userContext = `User: ${p.full_name || 'job seeker'}, Location: ${p.location || 'unknown'}, Degree: ${p.degree || 'unknown'} in ${p.field_of_study || 'unknown'}, Skills: ${skills}, Profile strength: ${p.profile_strength}%`
      }
    }

    const systemPrompt = `You are NexaWork AI, a career assistant for Africa's smartest job platform.
You help job seekers in Cameroon and Africa find jobs, build CVs, and prepare for interviews.
You also help employers find the best candidates.
Current user context: ${userContext}
Today's date: ${new Date().toLocaleDateString()}
Respond in the same language as the user (English or French). Be warm, encouraging, and specific.
Keep responses concise (under 200 words) unless the user asks for detail.
When recommending jobs or actions, be specific to the African/Cameroon job market.`

    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'search_jobs',
          description: 'Search for jobs in the NexaWork database based on user criteria',
          parameters: {
            type: 'object',
            properties: {
              keywords: { type: 'string', description: 'Job title or keywords' },
              location: { type: 'string', description: 'City or country' },
              job_type: { type: 'string', enum: ['full_time', 'part_time', 'internship', 'contract', 'graduate_scheme'] },
              remote: { type: 'boolean' },
              experience_level: { type: 'string', enum: ['entry', 'mid', 'senior', 'any'] }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_profile_tips',
          description: 'Get specific tips to improve the current user profile strength',
          parameters: { type: 'object', properties: {} }
        }
      }
    ]

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message }
    ]

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 800
      })

      const choice = response.choices[0]

      // Handle function calls
      if (choice.message.tool_calls) {
        const toolCall = choice.message.tool_calls[0]
        let toolResult = ''

        if (toolCall.function.name === 'search_jobs') {
          const args = JSON.parse(toolCall.function.arguments)
          let query = supabase
            .from('jobs')
            .select('id, title, company_name, location, job_type, is_remote, experience_level, salary_min, salary_max, salary_currency')
            .eq('is_active', true)
            .limit(5)

          if (args.keywords) query = query.ilike('title', `%${args.keywords}%`)
          if (args.location) query = query.ilike('location', `%${args.location}%`)
          if (args.job_type) query = query.eq('job_type', args.job_type)
          if (args.remote) query = query.eq('is_remote', true)
          if (args.experience_level) query = query.eq('experience_level', args.experience_level)

          const { data: jobs } = await query
          toolResult = JSON.stringify(jobs || [])
        }

        if (toolCall.function.name === 'get_profile_tips') {
          const { data: p } = await supabase
            .from('profiles_seeker')
            .select('profile_strength, bio, cv_url, location, degree')
            .eq('user_id', id)
            .single()
          toolResult = JSON.stringify({ profile: p, tips: generateProfileTips(p) })
        }

        // Second call with tool results
        const followUp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            ...messages,
            choice.message,
            { role: 'tool', tool_call_id: toolCall.id, content: toolResult }
          ],
          max_tokens: 800
        })

        const finalContent = followUp.choices[0].message.content || ''

        // Save to chat history
        await supabase.from('chat_messages').insert([
          { user_id: id, role: 'user', content: message },
          { user_id: id, role: 'assistant', content: finalContent }
        ])

        return reply.send({ reply: finalContent, tool_used: toolCall.function.name })
      }

      const finalContent = choice.message.content || ''
      await supabase.from('chat_messages').insert([
        { user_id: id, role: 'user', content: message },
        { user_id: id, role: 'assistant', content: finalContent }
      ])

      return reply.send({ reply: finalContent })
    } catch (e: any) {
      return reply.status(500).send({ error: 'AI service unavailable: ' + e.message })
    }
  })

  // POST /ai/generate-cv — CV generator from 5 prompts
  app.post('/ai/generate-cv', { preHandler: authenticate }, async (request, reply) => {
    const { answers } = request.body as { answers: string[] }
    const { id } = request.user!

    const prompt = `Generate a professional CV for a job seeker in Africa based on these answers:
1. Full Name & Contact: ${answers[0]}
2. Education: ${answers[1]}
3. Skills & Technologies: ${answers[2]}
4. Projects or Experience: ${answers[3]}
5. Career Objective: ${answers[4]}

Format the CV as clean HTML with proper sections: Contact Info, Career Objective, Education, Skills, Projects/Experience.
Use professional language. Optimise for ATS systems. Keep it to one page.
Return ONLY the HTML, no explanation.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    })

    const cvHtml = response.choices[0].message.content || ''
    return reply.send({ cv_html: cvHtml })
  })

  // POST /ai/parse-cv — extract profile from CV text
  app.post('/ai/parse-cv', { preHandler: authenticate }, async (request, reply) => {
    const { cv_text } = request.body as { cv_text: string }

    const prompt = `Extract structured information from this CV text. Return ONLY valid JSON with these fields:
{
  "full_name": "",
  "email": "",
  "phone": "",
  "location": "",
  "degree": "",
  "field_of_study": "",
  "institution": "",
  "graduation_year": null,
  "bio": "",
  "skills": []
}

CV Text:
${cv_text.slice(0, 4000)}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800
    })

    try {
      const text = response.choices[0].message.content || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      return reply.send({ profile: parsed })
    } catch {
      return reply.status(422).send({ error: 'Could not parse CV' })
    }
  })

  // POST /ai/improve-job — employer: improve job description
  app.post('/ai/improve-job', { preHandler: requireRole('employer') }, async (request, reply) => {
    const { title, description, requirements } = request.body as {
      title: string; description: string; requirements: string
    }

    const prompt = `Improve this job posting for NexaWork, Africa's leading job platform.
Make it: clear, engaging, inclusive (no gender bias), ATS-optimised, and appealing to African candidates.

Title: ${title}
Description: ${description}
Requirements: ${requirements}

Return JSON: { "improved_description": "...", "improved_requirements": "...", "tags": ["skill1", "skill2"] }`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200
    })

    try {
      const text = response.choices[0].message.content || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      return reply.send(JSON.parse(clean))
    } catch {
      return reply.status(422).send({ error: 'Could not improve job description' })
    }
  })

  // GET /ai/chat/history
  app.get('/ai/chat/history', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: true })
      .limit(50)

    return reply.send({ messages: data || [] })
  })
}

function generateProfileTips(profile: any): string[] {
  const tips: string[] = []
  if (!profile?.bio) tips.push('Add a professional bio to stand out to employers')
  if (!profile?.cv_url) tips.push('Upload or generate your CV to unlock more opportunities')
  if (!profile?.location) tips.push('Add your location to get local job recommendations')
  if (!profile?.degree) tips.push('Add your education details to improve match quality')
  if (tips.length === 0) tips.push('Your profile looks great! Keep applying to matched jobs.')
  return tips
}
