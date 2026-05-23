import axios from 'axios'
import { RawJob, inferJobType, inferLevel, inferRemote, normaliseDate, stripHtml } from './normalizer.js'

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

const SEARCH_QUERIES = [
  { query: 'jobs in Cameroon',              location: 'Cameroon' },
  { query: 'software developer Cameroon',   location: 'Cameroon' },
  { query: 'jobs in Douala',                location: 'Douala Cameroon' },
  { query: 'jobs in Yaoundé',               location: 'Yaoundé Cameroon' },
  { query: 'graduate trainee Africa',       location: 'Africa' },
  { query: 'internship Cameroon',           location: 'Cameroon' },
  { query: 'junior developer Africa remote', location: 'Africa' },
  { query: 'marketing jobs Cameroon',       location: 'Cameroon' },
  { query: 'finance accounting Cameroon',   location: 'Cameroon' },
  { query: 'NGO jobs Cameroon',             location: 'Cameroon' },
]

export async function fetchJSearchJobs(): Promise<RawJob[]> {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') {
    console.warn('[JSearch] No API key configured — skipping JSearch')
    return []
  }

  const results: RawJob[] = []
  let successCount = 0
  let failCount = 0

  for (const { query, location } of SEARCH_QUERIES) {
    try {
      const { data } = await axios.get(BASE_URL, {
        params: { query, location, num_pages: '1', date_posted: 'week' },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        },
        timeout: 10000
      })

      const jobs: JSearchResult[] = data?.data || []
      successCount++

      for (const j of jobs) {
        if (!j.job_title || !j.employer_name) continue
        results.push({
          external_id: `jsearch_${j.job_id}`,
          title: j.job_title,
          company_name: j.employer_name,
          location: [j.job_city, j.job_country].filter(Boolean).join(', ') || 'Cameroon',
          is_remote: j.job_is_remote || inferRemote(j.job_title + ' ' + (j.job_description || '')),
          job_type: inferJobType(j.job_employment_type || ''),
          experience_level: inferLevel(j.job_title + ' ' + (j.job_description || '')),
          description: stripHtml(j.job_description || '').slice(0, 2000),
          requirements: null,
          tags: j.job_required_skills?.slice(0, 10) || [],
          salary_min: j.job_min_salary,
          salary_max: j.job_max_salary,
          salary_currency: j.job_salary_currency || 'USD',
          external_url: j.job_apply_link,
          source: 'jsearch',
          posted_at: normaliseDate(j.job_posted_at_datetime_utc),
        })
      }

      // Rate limit: wait 1.5s between requests
      await new Promise(r => setTimeout(r, 1500))

    } catch (err: any) {
      failCount++
      const status = err?.response?.status
      const msg = status === 429 ? 'Rate limited' : status === 403 ? 'Invalid API key' : err.message
      console.warn(`[JSearch] Query "${query}" failed: ${msg}`)

      // Stop on auth errors — no point continuing
      if (status === 403) {
        console.error('[JSearch] API key invalid — stopping JSearch queries')
        break
      }
      // On rate limit, wait longer
      if (status === 429) await new Promise(r => setTimeout(r, 5000))
    }
  }

  console.log(`[JSearch] Fetched ${results.length} jobs (${successCount} ok, ${failCount} failed)`)
  return results
}
