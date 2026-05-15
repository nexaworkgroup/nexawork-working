import OpenAI from 'openai'
import { supabase } from '../../lib/supabase.js'
import { RawJob } from './normalizer.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface SaveResult {
  inserted: number
  skipped: number
  embedded: number
  errors: number
}

export async function saveAndEmbedJobs(jobs: RawJob[], source: string): Promise<SaveResult> {
  const result: SaveResult = { inserted: 0, skipped: 0, embedded: 0, errors: 0 }
  if (!jobs.length) return result

  console.log(`[Embedder:${source}] Processing ${jobs.length} jobs…`)

  // ── Step 1: Deduplicate by external_url against DB ────────────────
  const urls = jobs.map(j => j.external_url).filter(Boolean)
  const { data: existing } = await supabase
    .from('jobs')
    .select('external_url')
    .in('external_url', urls)

  const existingUrls = new Set((existing || []).map((r: any) => r.external_url))
  const newJobs = jobs.filter(j => !existingUrls.has(j.external_url))
  result.skipped = jobs.length - newJobs.length

  if (!newJobs.length) {
    console.log(`[Embedder:${source}] All ${result.skipped} jobs already in DB`)
    return result
  }

  // ── Step 2: Insert new jobs (without embeddings first) ────────────
  const rows = newJobs.map(j => ({
    source: j.source,
    external_id: j.external_id,
    external_url: j.external_url,
    title: j.title,
    company_name: j.company_name,
    location: j.location,
    is_remote: j.is_remote,
    job_type: j.job_type,
    experience_level: j.experience_level || 'any',
    description: j.description,
    requirements: j.requirements,
    salary_min: j.salary_min,
    salary_max: j.salary_max,
    salary_currency: j.salary_currency || 'XAF',
    tags: j.tags || [],
    posted_at: j.posted_at,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    is_active: true
  }))

  const { data: inserted, error: insertErr } = await supabase
    .from('jobs')
    .insert(rows)
    .select('id, title, description, requirements')
    .throwOnError()

  if (insertErr) {
    console.error(`[Embedder:${source}] Insert error:`, insertErr.message)
    result.errors++
    return result
  }

  result.inserted = (inserted || []).length
  console.log(`[Embedder:${source}] Inserted ${result.inserted} new jobs`)

  // ── Step 3: Embed in batches of 10 ───────────────────────────────
  if (!process.env.OPENAI_API_KEY) {
    console.warn(`[Embedder:${source}] No OpenAI key — skipping embeddings`)
    return result
  }

  const BATCH = 10
  const toEmbed = inserted || []

  for (let i = 0; i < toEmbed.length; i += BATCH) {
    const batch = toEmbed.slice(i, i + BATCH)

    const texts = batch.map(j =>
      `${j.title} ${j.description || ''} ${j.requirements || ''}`.slice(0, 6000)
    )

    try {
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts
      })

      // Update each job with its embedding
      await Promise.all(
        res.data.map((item, idx) =>
          supabase
            .from('jobs')
            .update({ embedding: item.embedding as any })
            .eq('id', batch[idx].id)
        )
      )

      result.embedded += batch.length
      console.log(`[Embedder:${source}] Embedded batch ${Math.floor(i / BATCH) + 1} (${result.embedded}/${toEmbed.length})`)
    } catch (err: any) {
      console.error(`[Embedder:${source}] Embedding batch failed:`, err.message)
      result.errors++
    }

    // Rate limit: 500ms between batches
    if (i + BATCH < toEmbed.length) await delay(500)
  }

  return result
}

// Re-embed all jobs that have no embedding yet (recovery function)
export async function embedMissingJobs(): Promise<number> {
  if (!process.env.OPENAI_API_KEY) return 0

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, description, requirements')
    .is('embedding', null)
    .eq('is_active', true)
    .limit(100)

  if (!jobs?.length) return 0
  console.log(`[Embedder] Re-embedding ${jobs.length} jobs missing embeddings…`)

  let count = 0
  const BATCH = 10
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH)
    const texts = batch.map(j =>
      `${j.title} ${j.description || ''} ${j.requirements || ''}`.slice(0, 6000)
    )
    try {
      const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts })
      await Promise.all(
        res.data.map((item, idx) =>
          supabase.from('jobs').update({ embedding: item.embedding as any }).eq('id', batch[idx].id)
        )
      )
      count += batch.length
    } catch (err: any) {
      console.error('[Embedder] Re-embed batch failed:', err.message)
    }
    await delay(500)
  }

  console.log(`[Embedder] Re-embedded ${count} jobs`)
  return count
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
