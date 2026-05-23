import cron from 'node-cron'
import { runAggregationPipeline, expireOldJobs } from './scraper/pipeline.js'
import { embedMissingJobs } from './scraper/embedder.js'
import { processJobAlerts } from './alerts.js'

let isRunning = false

export function startScheduler() {
  console.log('📅 Job aggregation scheduler started')

  // ── Every 6 hours: full aggregation pipeline ─────────────────────
  // Runs at: 00:00, 06:00, 12:00, 18:00
  cron.schedule('0 0,6,12,18 * * *', async () => {
    if (isRunning) {
      console.log('[Scheduler] Pipeline already running — skipping this tick')
      return
    }
    isRunning = true
    try {
      await runAggregationPipeline()
    } finally {
      isRunning = false
    }
  })

  // ── Daily at 8:00 AM: process job alerts ──────────────────────────
  cron.schedule('0 8 * * *', async () => {
    try {
      await processJobAlerts()
    } catch (e) { console.error('[Scheduler] Job alerts error:', e) }
  })

  // ── Daily at 3:00 AM: expire old jobs ────────────────────────────
  cron.schedule('0 3 * * *', async () => {
    await expireOldJobs()
  })

  // ── Every 30 minutes: embed any jobs missing embeddings ──────────
  // (catches failures from previous runs)
  cron.schedule('*/30 * * * *', async () => {
    await embedMissingJobs()
  })

  // ── Run seed jobs immediately on startup ─────────────────────────
  setTimeout(async () => {
    console.log('\n[Scheduler] Running initial seed on startup…')
    await runAggregationPipeline({ sources: ['seeds'] })

    // Then run full pipeline after a short delay
    setTimeout(async () => {
      if (!isRunning) {
        isRunning = true
        try {
          await runAggregationPipeline()
        } finally {
          isRunning = false
        }
      }
    }, 30_000) // 30s after seed completes
  }, 5_000) // 5s after server starts
}
