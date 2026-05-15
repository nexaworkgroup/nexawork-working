import axios from 'axios'
import * as cheerio from 'cheerio'
import {
  RawJob, inferJobType, inferLevel, inferRemote, stripHtml, normaliseDate
} from './normalizer.js'

const BASE = 'https://www.emploi.cm'
const LISTINGS_URL = `${BASE}/offres-emploi`

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept-Language': 'fr-CM,fr;q=0.9,en;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

export async function scrapeEmploiCm(): Promise<RawJob[]> {
  const jobs: RawJob[] = []

  try {
    // Scrape first 3 pages
    for (let page = 1; page <= 3; page++) {
      const url = page === 1 ? LISTINGS_URL : `${LISTINGS_URL}?page=${page}`
      const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 20_000 })
      const $ = cheerio.load(html)
      const pageJobs = parseListingPage($)
      jobs.push(...pageJobs)
      if (pageJobs.length < 5) break // no more pages
      await delay(2000 + Math.random() * 1000)
    }
  } catch (err: any) {
    console.error('[Emploi.cm] Scrape failed:', err.message)
  }

  console.log(`[Emploi.cm] Scraped ${jobs.length} jobs`)
  return jobs
}

function parseListingPage($: cheerio.CheerioAPI): RawJob[] {
  const jobs: RawJob[] = []

  // Try multiple selectors (site may update layout)
  const selectors = [
    '.job-item', '.offre-emploi', 'article.job', '.vacancy-item',
    '.list-item', '[class*="job"]', '[class*="offre"]'
  ]

  let found = false
  for (const sel of selectors) {
    const items = $(sel)
    if (items.length > 0) {
      items.each((_, el) => {
        const job = parseJobElement($, el)
        if (job) jobs.push(job)
      })
      found = true
      break
    }
  }

  // Fallback: try to find job links from any anchor tags
  if (!found) {
    $('a[href*="offre"], a[href*="emploi"], a[href*="job"]').each((_, el) => {
      const href = $(el).attr('href')
      const title = $(el).text().trim()
      if (!href || !title || title.length < 5) return
      const url = href.startsWith('http') ? href : `${BASE}${href}`
      jobs.push(buildFallbackJob(title, url, 'Cameroun'))
    })
  }

  return jobs
}

function parseJobElement($: cheerio.CheerioAPI, el: any): RawJob | null {
  const $el = $(el)

  // Try to extract title
  const titleEl = $el.find('h2, h3, h4, .title, .job-title, .poste, [class*="title"]').first()
  const title = titleEl.text().trim() || $el.find('a').first().text().trim()
  if (!title || title.length < 4) return null

  // Company
  const company = $el.find('.company, .entreprise, .employer, [class*="company"], [class*="entreprise"]').first().text().trim()
    || 'Unknown Company'

  // Location
  const location = $el.find('.location, .localisation, .lieu, [class*="location"], [class*="lieu"]').first().text().trim()
    || 'Cameroun'

  // Link
  const linkEl = $el.find('a[href]').first()
  const href = linkEl.attr('href') || ''
  const url = href.startsWith('http') ? href : `${BASE}${href}`
  if (!url.includes('emploi.cm') && !href) return null

  // Date
  const dateText = $el.find('.date, time, [class*="date"]').first().text().trim()

  const description = stripHtml($el.find('.description, .excerpt, p').first().html() || '')

  return {
    title,
    company_name: company,
    location: location || 'Cameroun',
    is_remote: inferRemote(title, description),
    job_type: inferJobType(title, description),
    experience_level: inferLevel(title, description),
    description: description || null,
    requirements: null,
    salary_min: null,
    salary_max: null,
    salary_currency: 'XAF',
    tags: [],
    external_url: url || `${BASE}/offres`,
    external_id: url,
    source: 'scraped_emploicm',
    posted_at: parseFrenchDate(dateText)
  }
}

function buildFallbackJob(title: string, url: string, location: string): RawJob {
  return {
    title, company_name: 'Emploi.cm Listing', location,
    is_remote: false, job_type: inferJobType(title),
    experience_level: inferLevel(title),
    description: null, requirements: null,
    salary_min: null, salary_max: null, salary_currency: 'XAF',
    tags: [], external_url: url, external_id: url,
    source: 'scraped_emploicm', posted_at: new Date().toISOString()
  }
}

function parseFrenchDate(text: string): string {
  if (!text) return new Date().toISOString()
  const months: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  }
  for (const [fr, idx] of Object.entries(months)) {
    if (text.toLowerCase().includes(fr)) {
      const year = new Date().getFullYear()
      return new Date(year, idx, 1).toISOString()
    }
  }
  return normaliseDate(text)
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
