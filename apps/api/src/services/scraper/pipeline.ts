import { scrapeJSearch } from './jsearch.js'
import { scrapeEmploiCm } from './emploicm.js'
import { scrapeMTN } from './mtn.js'
import { scrapeOrange } from './orange.js'
import { getCameroonSeedJobs } from './cameroonJobs.js'
import { saveAndEmbedJobs } from './embedder.js'

interface PipelineResult {
  total_fetched: number
  total_inserted: number
  total_embedded: number
  total_skipped: number
  sources: Record<string, { fetched: number; inserted: number; embedded: number }>
  duration_ms: number
  errors: string[]
}

export async function runAggregationPipeline(options: {
  sources?: string[]
  seedOnly?: boolean
} = {}): Promise<PipelineResult> {
  const start = Date.now()
  const result: PipelineResult = {
    total_fetched: 0,
    total_inserted: 0,
    total_embedded: 0,
    total_skipped: 0,
    sources: {},
    duration_ms: 0,
    errors: []
  }

  const { sources = ['all'], seedOnly = false } = options
  const runAll = sources.includes('all')

  console.log('\n🚀 NexaWork Aggregation Pipeline starting…')
  console.log(`Sources: ${sources.join(', ')} | Seed only: ${seedOnly}`)

  // Helper to run a scraper safely
  async function runSource(
    name: string,
    key: string,
    fn: () => Promise<any[]>
  ) {
    if (!runAll && !sources.includes(key)) return
    console.log(`\n── [${name}] Starting…`)
    try {
      const jobs = await fn()
      result.total_fetched += jobs.length
      result.sources[key] = { fetched: jobs.length, inserted: 0, embedded: 0 }

      if (jobs.length > 0) {
        const r = await saveAndEmbedJobs(jobs, name)
        result.total_inserted += r.inserted
        result.total_embedded += r.embedded
        result.total_skipped += r.skipped
        result.sources[key].inserted = r.inserted
        result.sources[key].embedded = r.embedded
        if (r.errors > 0) result.errors.push(`${name}: ${r.errors} embed errors`)
      }
    } catch (err: any) {
      console.error(`[${name}] FAILED:`, err.message)
      result.errors.push(`${name}: ${err.message}`)
    }
  }

  // ── 1. Cameroon seed jobs (always runs — these are curated) ──────
  await runSource('Cameroon Seeds', 'seeds', getCameroonSeedJobs)

  if (!seedOnly) {
    // ── 2. JSearch API (LinkedIn, Indeed, Glassdoor) ─────────────
    await runSource('JSearch API', 'jsearch', scrapeJSearch)

    // ── 3. Emploi.cm ─────────────────────────────────────────────
    await runSource('Emploi.cm', 'emploicm', scrapeEmploiCm)

    // ── 4. MTN Cameroon ──────────────────────────────────────────
    await runSource('MTN Cameroon', 'mtn', scrapeMTN)

    // ── 5. Orange Cameroon ───────────────────────────────────────
    await runSource('Orange Cameroon', 'orange', scrapeOrange)
  }

  result.duration_ms = Date.now() - start

  console.log('\n✅ Pipeline complete:')
  console.log(`   Fetched:  ${result.total_fetched}`)
  console.log(`   Inserted: ${result.total_inserted}`)
  console.log(`   Embedded: ${result.total_embedded}`)
  console.log(`   Skipped:  ${result.total_skipped} (duplicates)`)
  console.log(`   Duration: ${(result.duration_ms / 1000).toFixed(1)}s`)
  if (result.errors.length) console.log(`   Errors:   ${result.errors.join(', ')}`)

  return result
}

// Expire jobs older than 30 days
export async function expireOldJobs(): Promise<number> {
  const { supabase } = await import('../../lib/supabase.js')
  const { data, error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .lt('expires_at', new Date().toISOString())
    .eq('is_active', true)
    .select('id')

  const count = data?.length || 0
  if (count > 0) console.log(`[Expire] Archived ${count} expired jobs`)
  return count
}
