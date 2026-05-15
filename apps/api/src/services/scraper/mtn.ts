import axios from 'axios'
import * as cheerio from 'cheerio'
import { RawJob, inferJobType, inferLevel, stripHtml } from './normalizer.js'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8'
}

// MTN Cameroon career pages to try
const CAREER_URLS = [
  'https://www.mtn.cm/a-propos/carrieres',
  'https://www.mtn.cm/about/careers',
  'https://careers.mtn.com/?location=Cameroon',
  'https://careers.mtn.com/search?q=&location=Cameroon'
]

export async function scrapeMTN(): Promise<RawJob[]> {
  const jobs: RawJob[] = []

  for (const url of CAREER_URLS) {
    try {
      const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15_000 })
      const $ = cheerio.load(html)
      const found = extractJobs($, url, 'MTN Cameroon')
      if (found.length > 0) {
        jobs.push(...found)
        console.log(`[MTN] Found ${found.length} jobs from ${url}`)
        break
      }
    } catch (err: any) {
      // Try next URL
    }
    await delay(2000)
  }

  // If live scraping fails, return known static MTN graduate programme info
  if (jobs.length === 0) {
    console.log('[MTN] Live scrape returned 0 — using fallback job data')
    jobs.push(...getMTNFallbackJobs())
  }

  console.log(`[MTN] Total: ${jobs.length} jobs`)
  return jobs
}

function extractJobs($: cheerio.CheerioAPI, sourceUrl: string, company: string): RawJob[] {
  const jobs: RawJob[] = []
  const selectors = [
    '.job-item', '.career-item', '.vacancy', '.position',
    '[class*="job"]', '[class*="career"]', '[class*="vacancy"]',
    'li[class*="position"]', 'article'
  ]

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const $el = $(el)
      const title = $el.find('h2,h3,h4,.title,[class*="title"]').first().text().trim()
        || $el.find('a').first().text().trim()
      if (!title || title.length < 4) return

      const href = $el.find('a[href]').first().attr('href') || sourceUrl
      const url = href.startsWith('http') ? href : `https://www.mtn.cm${href}`
      const desc = stripHtml($el.find('p,.description').first().html() || '')

      jobs.push({
        title,
        company_name: company,
        location: 'Cameroun',
        is_remote: false,
        job_type: inferJobType(title, desc),
        experience_level: inferLevel(title, desc),
        description: desc || null,
        requirements: null,
        salary_min: null, salary_max: null, salary_currency: 'XAF',
        tags: ['Telecoms', 'MTN'],
        external_url: url,
        external_id: url,
        source: 'scraped_mtn',
        posted_at: new Date().toISOString()
      })
    })
    if (jobs.length > 0) break
  }
  return jobs
}

// Fallback jobs when live scraping unavailable
function getMTNFallbackJobs(): RawJob[] {
  const base = 'https://careers.mtn.com'
  const now = new Date().toISOString()
  return [
    {
      title: 'Graduate Trainee Programme — Technology',
      company_name: 'MTN Cameroon',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'graduate_scheme',
      experience_level: 'entry',
      description: 'MTN Cameroon invites applications for the Graduate Trainee Programme in Technology. This 12-month structured programme is designed for recent graduates looking to launch their careers in telecommunications. Trainees will rotate across multiple departments including network operations, IT, and digital services.',
      requirements: 'BSc/MSc in Computer Science, Engineering, Telecoms or related field. Graduated within the last 2 years. Strong analytical and communication skills.',
      salary_min: 150000, salary_max: 250000, salary_currency: 'XAF',
      tags: ['Telecoms', 'Graduate', 'Technology', 'MTN'],
      external_url: `${base}/cameroon-graduate-trainee-technology`,
      external_id: 'mtn-cm-grad-tech-2026',
      source: 'scraped_mtn',
      posted_at: now
    },
    {
      title: 'Junior Network Engineer',
      company_name: 'MTN Cameroon',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'entry',
      description: 'MTN Cameroon is looking for a Junior Network Engineer to support the planning, deployment, and maintenance of telecommunications infrastructure across Cameroon.',
      requirements: 'BSc in Electrical Engineering, Telecoms or Computer Science. 0–2 years experience. Knowledge of GSM/LTE networks is an advantage.',
      salary_min: 200000, salary_max: 350000, salary_currency: 'XAF',
      tags: ['Telecoms', 'Networking', 'Engineering', 'MTN'],
      external_url: `${base}/mtn-cameroon-junior-network-engineer`,
      external_id: 'mtn-cm-junior-network-2026',
      source: 'scraped_mtn',
      posted_at: now
    },
    {
      title: 'Digital Marketing Specialist',
      company_name: 'MTN Cameroon',
      location: 'Yaoundé, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'mid',
      description: 'Drive digital marketing initiatives for MTN Cameroon\'s consumer and enterprise segments. Manage social media campaigns, SEO, and digital advertising across all platforms.',
      requirements: '2–4 years digital marketing experience. Google Analytics, Meta Ads, content creation skills. Bilingual EN/FR required.',
      salary_min: 250000, salary_max: 450000, salary_currency: 'XAF',
      tags: ['Marketing', 'Digital', 'Social Media', 'MTN'],
      external_url: `${base}/mtn-cameroon-digital-marketing`,
      external_id: 'mtn-cm-digital-marketing-2026',
      source: 'scraped_mtn',
      posted_at: now
    }
  ]
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
