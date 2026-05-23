// Email service using Resend (https://resend.com - free 3000/month)
// Install: npm install resend

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'NexaWork <noreply@nexawork.app>'
const APP_URL = process.env.FRONTEND_URL || 'https://nexawork-working-web.vercel.app'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] No RESEND_API_KEY — skipping email to', to)
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Email] Failed:', err)
      return false
    }

    console.log(`[Email] Sent "${subject}" to ${to}`)
    return true
  } catch (e: any) {
    console.error('[Email] Error:', e.message)
    return false
  }
}

// ── Email templates ──────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, role: 'job_seeker' | 'employer') {
  const isSeeker = role === 'job_seeker'
  return sendEmail({
    to,
    subject: `Welcome to NexaWork${name ? `, ${name}` : ''}! 🎉`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#1A7A4A;padding:32px 24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px"><span style="color:#E8B84B">Nexa</span>Work</h1>
          <p style="color:#a7f3d0;margin:8px 0 0">"Your First Job Finds You"</p>
        </div>
        <div style="padding:32px 24px">
          <h2 style="color:#111;margin:0 0 16px">Welcome${name ? `, ${name}` : ''}! 👋</h2>
          <p style="color:#555;line-height:1.6">
            ${isSeeker
              ? "Your NexaWork account is ready. Our AI is already analysing jobs that match your profile. Complete your profile to get the best matches."
              : "Your NexaWork employer account is ready. Post your first job and start finding the best African talent today."}
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${APP_URL}${isSeeker ? '/dashboard' : '/employer/dashboard'}"
               style="background:#1A7A4A;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              ${isSeeker ? 'View My Job Matches' : 'Post a Job'}
            </a>
          </div>
          ${isSeeker ? `
          <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-top:16px">
            <p style="margin:0;color:#1A7A4A;font-weight:bold">Quick tips to get more matches:</p>
            <ul style="color:#555;margin:8px 0 0;padding-left:20px;line-height:1.8">
              <li>Complete your education details</li>
              <li>Add your top skills</li>
              <li>Upload your CV</li>
            </ul>
          </div>` : ''}
        </div>
        <div style="background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px;margin:0">
            © 2026 NexaWork · Africa's AI Job Platform ·
            <a href="${APP_URL}/unsubscribe" style="color:#999">Unsubscribe</a>
          </p>
        </div>
      </div>`
  })
}

export async function sendApplicationConfirmation(to: string, name: string, jobTitle: string, company: string) {
  return sendEmail({
    to,
    subject: `Application submitted: ${jobTitle} at ${company} ✅`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A7A4A;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px"><span style="color:#E8B84B">Nexa</span>Work</h1>
        </div>
        <div style="padding:32px 24px">
          <h2 style="color:#111">Application Received! ✅</h2>
          <p style="color:#555">Hi ${name || 'there'},</p>
          <p style="color:#555;line-height:1.6">
            Your application for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been submitted successfully.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:24px 0">
            <p style="margin:0;color:#166534;font-size:14px">
              📧 The employer will review your profile and contact you if you're shortlisted.
              Track your application status in your NexaWork dashboard.
            </p>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${APP_URL}/applications"
               style="background:#1A7A4A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              Track My Applications
            </a>
          </div>
        </div>
        <div style="background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px;margin:0">© 2026 NexaWork · Africa's AI Job Platform</p>
        </div>
      </div>`
  })
}

export async function sendStatusUpdateEmail(to: string, name: string, jobTitle: string, company: string, status: string) {
  const STATUS_INFO: Record<string, { emoji: string; message: string; color: string }> = {
    viewed:      { emoji: '👀', message: 'Your application has been viewed by the employer.',        color: '#3b82f6' },
    shortlisted: { emoji: '🌟', message: 'Great news! You have been shortlisted for this position.', color: '#f59e0b' },
    interview:   { emoji: '🎯', message: 'You have been invited for an interview!',                  color: '#8b5cf6' },
    offered:     { emoji: '🎉', message: 'Congratulations! You have received a job offer!',          color: '#1A7A4A' },
    rejected:    { emoji: '📋', message: 'Thank you for your interest. The employer has moved forward with other candidates.', color: '#6b7280' },
  }

  const info = STATUS_INFO[status]
  if (!info) return false

  return sendEmail({
    to,
    subject: `${info.emoji} Application update: ${jobTitle} at ${company}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A7A4A;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px"><span style="color:#E8B84B">Nexa</span>Work</h1>
        </div>
        <div style="padding:32px 24px">
          <div style="text-align:center;font-size:48px;margin-bottom:16px">${info.emoji}</div>
          <h2 style="color:#111;text-align:center">Application Update</h2>
          <p style="color:#555">Hi ${name || 'there'},</p>
          <div style="background:#f9f9f9;border-left:4px solid ${info.color};padding:16px;border-radius:0 8px 8px 0;margin:16px 0">
            <p style="margin:0;font-weight:bold;color:#111">${jobTitle} at ${company}</p>
            <p style="margin:8px 0 0;color:#555">${info.message}</p>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${APP_URL}/applications"
               style="background:#1A7A4A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              View My Applications
            </a>
          </div>
        </div>
        <div style="background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px;margin:0">© 2026 NexaWork · Africa's AI Job Platform</p>
        </div>
      </div>`
  })
}

export async function sendInterviewEmail(to: string, name: string, jobTitle: string, company: string, date: string, type: string, location: string) {
  return sendEmail({
    to,
    subject: `🎯 Interview Scheduled: ${jobTitle} at ${company}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A7A4A;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px"><span style="color:#E8B84B">Nexa</span>Work</h1>
        </div>
        <div style="padding:32px 24px">
          <div style="text-align:center;font-size:48px;margin-bottom:16px">🎯</div>
          <h2 style="color:#111;text-align:center">Interview Scheduled!</h2>
          <p style="color:#555">Hi ${name || 'there'},</p>
          <p style="color:#555;line-height:1.6">${company} has scheduled an interview with you for <strong>${jobTitle}</strong>.</p>
          <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:24px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="color:#555;padding:4px 0;width:120px">📅 Date & Time</td><td style="color:#111;font-weight:bold">${date}</td></tr>
              <tr><td style="color:#555;padding:4px 0">📞 Type</td><td style="color:#111;font-weight:bold;text-transform:capitalize">${type.replace('_', ' ')}</td></tr>
              ${location ? `<tr><td style="color:#555;padding:4px 0">📍 Details</td><td style="color:#1A7A4A;font-weight:bold">${location}</td></tr>` : ''}
            </table>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${APP_URL}/interviews"
               style="background:#1A7A4A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              View Interview Details
            </a>
          </div>
        </div>
        <div style="background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px;margin:0">© 2026 NexaWork · Africa's AI Job Platform</p>
        </div>
      </div>`
  })
}

export async function sendJobAlertEmail(to: string, name: string, jobs: any[], alertKeywords: string) {
  if (!jobs.length) return false
  const jobListHtml = jobs.slice(0, 5).map(j => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
      <p style="margin:0;font-weight:bold;color:#111">${j.title}</p>
      <p style="margin:4px 0;color:#555;font-size:14px">${j.company_name} · ${j.location || 'Cameroon'}</p>
      <a href="${APP_URL}/jobs/${j.id}" style="color:#1A7A4A;font-size:14px;text-decoration:none">View & Apply →</a>
    </div>`).join('')

  return sendEmail({
    to,
    subject: `🔔 ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching "${alertKeywords}"`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1A7A4A;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px"><span style="color:#E8B84B">Nexa</span>Work</h1>
        </div>
        <div style="padding:32px 24px">
          <h2 style="color:#111">New Jobs for "${alertKeywords}" 🔔</h2>
          <p style="color:#555">Hi ${name || 'there'}, we found ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching your alert.</p>
          ${jobListHtml}
          <div style="text-align:center;margin:24px 0">
            <a href="${APP_URL}/jobs?q=${encodeURIComponent(alertKeywords)}"
               style="background:#1A7A4A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              View All Matches
            </a>
          </div>
        </div>
        <div style="background:#f9f9f9;padding:16px 24px;text-align:center;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px;margin:0">
            © 2026 NexaWork ·
            <a href="${APP_URL}/job-alerts" style="color:#999">Manage Alerts</a>
          </p>
        </div>
      </div>`
  })
}
