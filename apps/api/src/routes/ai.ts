import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,  // 30 second timeout
  maxRetries: 2    // retry twice on failure
})

export async function aiRoutes(app: FastifyInstance) {

  // POST /ai/chat — general assistant
  app.post('/ai/chat', { preHandler: authenticate }, async (request, reply) => {
    const { message, history = [] } = request.body as { message: string; history?: any[] }
    const { id, role } = request.user!

    const systemPrompt = role === 'employer'
      ? `You are a hiring assistant for NexaWork, Africa's AI job platform. Help employers write job descriptions, screen candidates, conduct interviews, and build their teams in Cameroon and Africa. Be concise and practical.`
      : `You are a career assistant for NexaWork, Africa's AI job platform. Help job seekers in Cameroon find jobs, improve their CVs, prepare for interviews, and develop their careers. Be encouraging, practical and bilingual (English/French). Keep responses concise.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })

      const reply_text = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

      // Save to history (non-blocking)
      Promise.resolve(supabase.from('chat_messages').insert([
        { user_id: id, role: 'user', content: message },
        { user_id: id, role: 'assistant', content: reply_text }
      ])).catch(() => {})

      return reply.send({ reply: reply_text })
    } catch (e: any) {
      console.error('[AI Chat] Error:', e.message)
      if (e.code === 'UND_ERR_CONNECT_TIMEOUT' || e.message?.includes('timeout')) {
        return reply.status(503).send({ error: 'AI service temporarily unavailable. Please try again.' })
      }
      return reply.status(500).send({ error: 'AI service error. Please try again.' })
    }
  })

  // POST /ai/generate-cv
  app.post('/ai/generate-cv', { preHandler: authenticate }, async (request, reply) => {
    const { answers } = request.body as { answers: string[] }

    const [personal, education, skills, experience, objective] = answers

    const prompt = `Generate a professional, ATS-optimized CV in clean HTML for an African job seeker. Use this information:

PERSONAL INFO: ${personal}
EDUCATION: ${education}
SKILLS: ${skills}
EXPERIENCE & PROJECTS: ${experience}
CAREER OBJECTIVE: ${objective}

Requirements:
- Use semantic HTML only (h1, h2, p, ul, li, strong)
- No CSS, no classes, no inline styles
- Structure: Name as h1, contact info as p, then sections as h2 headings
- Sections: Career Objective, Education, Skills, Experience/Projects
- Write in a professional, achievement-focused tone
- Quantify achievements where possible
- Keep it concise (1 page equivalent)
- Return ONLY the HTML body content, no <!DOCTYPE>, no <html>, no <head>, no <body> tags`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3
      })

      const cv_html = completion.choices[0]?.message?.content || ''
      return reply.send({ cv_html })
    } catch (e: any) {
      console.error('[AI CV] Error:', e.message)
      if (e.code === 'UND_ERR_CONNECT_TIMEOUT' || e.message?.includes('timeout')) {
        return reply.status(503).send({ error: 'AI service temporarily unavailable. Please try again in a moment.' })
      }
      return reply.status(500).send({ error: 'Failed to generate CV. Please try again.' })
    }
  })

  // POST /ai/improve-job — employer job description improver
  app.post('/ai/improve-job', { preHandler: authenticate }, async (request, reply) => {
    const { title, description } = request.body as { title: string; description: string }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Improve this job posting for "${title}" to be more attractive to African graduates. Make it clear, engaging, and inclusive. Keep it under 400 words.\n\nOriginal:\n${description}`
        }],
        max_tokens: 600,
        temperature: 0.5
      })

      return reply.send({ improved: completion.choices[0]?.message?.content || description })
    } catch (e: any) {
      return reply.status(500).send({ error: 'Could not improve description. Please try again.' })
    }
  })

  // POST /ai/parse-cv — extract info from uploaded CV
  app.post('/ai/parse-cv', { preHandler: authenticate }, async (request, reply) => {
    const { text } = request.body as { text: string }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Extract structured information from this CV text and return as JSON:\n\n${text.slice(0, 3000)}\n\nReturn JSON with: { full_name, email, phone, location, degree, field_of_study, institution, graduation_year, skills: [], experience_summary }`
        }],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}')
      return reply.send({ parsed })
    } catch (e: any) {
      return reply.status(500).send({ error: 'Could not parse CV.' })
    }
  })

  // GET /ai/chat/history
  app.get('/ai/chat/history', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20)
    return reply.send({ messages: (data || []).reverse() })
  })
}
