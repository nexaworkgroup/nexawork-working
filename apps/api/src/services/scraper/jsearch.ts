import axios from 'axios'
import {
  RawJob, inferJobType, inferLevel, inferRemote, normaliseDate, stripHtml
} from './normalizer.js'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''
const BASE_URL = 'https://jsearch.p.rapidapi.com/search'

interface JSearchResult {
  job_id: string
  job_title: string
  employer_name: string
  job_city: string | null
  job_country: string | null
  job_is_remote: boolean
  job_employment_type: string | null
  job_description: string | null
  job_required_skills: string[] | null
  job_min_salary: number | null
  job_max_salary: number | null
  job_salary_currency: string | null
  job_apply_link: string
  job_posted_at_datetime_utc: string | null
}

// Queries to run on each scrape cycle (Africa + global entry-level)
const SEARCH_QUERIES = [
  { query: 'jobs in Cameroon', location: 'Cameroon' },
  { query: 'software developer Cameroon', location: 'Cameroon' },
  { query: 'jobs in Douala', location: 'Douala Cameroon' },
  { query: 'jobs in Yaoundé', location: 'Yaounde Cameroon' },
  { query: 'graduate trainee Africa', location: 'Africa' },
  { query: 'internship Cameroon', location: 'Cameroon' },
  { query: 'junior developer Africa remote', location: '' },
  { query: 'marketing jobs Cameroon', location: 'Cameroon' },
  { query: 'finance accounting Cameroon', location: 'Cameroon' },
  { query: 'NGO jobs Cameroon', location: 'Cameroon' },
]

export async function scrapeJSearch(): Promise<RawJob[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('[JSearch] RAPIDAPI_KEY not set — skipping')
    return []
  }

  const all: RawJob[] = []

  for (const { query, location } of SEARCH_QUERIES) {
    try {
      const params: Record<string, string> = {
        query,
        page: '1',
        num_pages: '1',
        date_posted: 'month',
        language: 'en'
      }
      if (location) params.country = location

      const { data } = await axios.get(BASE_URL, {
        params,
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        },
        timeout: 15_000
      })

      const results: JSearchResult[] = data?.data || []

      for (const job of results) {
        if (!job.job_title || !job.employer_name || !job.job_apply_link) continue

        const location = [job.job_city, job.job_country].filter(Boolean).join(', ')
        const description = stripHtml(job.job_description)

        all.push({
          title: job.job_title.trim(),
          company_name: job.employer_name.trim(),
          location: location || null,
          is_remote: job.job_is_remote || inferRemote(job.job_title, description),
          job_type: inferJobType(job.job_title, description),
          experience_level: inferLevel(job.job_title, description),
          description,
          requirements: job.job_required_skills?.join(', ') || null,
          salary_min: job.job_min_salary ?? null,
          salary_max: job.job_max_salary ?? null,
          salary_currency: job.job_salary_currency || 'XAF',
          tags: job.job_required_skills?.slice(0, 10) || [],
          external_url: job.job_apply_link,
          external_id: job.job_id,
          source: 'jsearch',
          posted_at: normaliseDate(job.job_posted_at_datetime_utc)
        })
      }

      // Rate limit — JSearch allows ~1 req/sec on free tier
      await delay(1200)
    } catch (err: any) {
      console.error(`[JSearch] Query "${query}" failed:`, err.message)
    }
  }

  console.log(`[JSearch] Fetched ${all.length} jobs`)
  return all
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
