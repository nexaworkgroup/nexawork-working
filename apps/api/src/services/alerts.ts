import { supabase } from '../lib/supabase.js'
import { sendJobAlertEmail } from './email.js'

export async function processJobAlerts() {
  console.log('[Alerts] Processing job alerts...')

  try {
    // Get all active alerts
    const { data: alerts } = await supabase
      .from('job_alerts')
      .select('*, users(email, profiles_seeker(full_name))')
      .eq('is_active', true)

    if (!alerts?.length) {
      console.log('[Alerts] No active alerts to process')
      return
    }

    let sent = 0
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    for (const alert of alerts) {
      try {
        // Check frequency — skip if not due
        if (alert.frequency === 'weekly') {
          const lastSent = alert.last_sent_at ? new Date(alert.last_sent_at) : null
          if (lastSent && (now.getTime() - lastSent.getTime()) < 7 * 24 * 60 * 60 * 1000) continue
        }

        // Find matching jobs posted since last alert
        const since = alert.last_sent_at || yesterday.toISOString()
        let query = supabase
          .from('jobs')
          .select('id, title, company_name, location, job_type, posted_at')
          .eq('is_active', true)
          .gte('posted_at', since)
          .limit(10)

        // Filter by keywords
        if (alert.keywords) {
          query = query.ilike('title', `%${alert.keywords}%`)
        }

        // Filter by job type
        if (alert.job_type) {
          query = query.eq('job_type', alert.job_type)
        }

        const { data: matchingJobs } = await query

        if (!matchingJobs?.length) continue

        // Get user email
        const userEmail = (alert as any).users?.email
        const userName = (alert as any).users?.profiles_seeker?.full_name || ''

        if (!userEmail) continue

        // Send alert email
        await sendJobAlertEmail(userEmail, userName, matchingJobs, alert.keywords)

        // Update last_sent_at
        await supabase.from('job_alerts')
          .update({ last_sent_at: now.toISOString() })
          .eq('id', alert.id)

        sent++
      } catch (e: any) {
        console.error(`[Alerts] Failed for alert ${alert.id}:`, e.message)
      }
    }

    console.log(`[Alerts] Processed ${alerts.length} alerts, sent ${sent} emails`)
  } catch (e: any) {
    console.error('[Alerts] Error:', e.message)
  }
}
