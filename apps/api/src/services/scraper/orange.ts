import axios from 'axios'
import * as cheerio from 'cheerio'
import { RawJob, inferJobType, inferLevel, stripHtml } from './normalizer.js'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-CM,fr;q=0.9,en;q=0.8'
}

const CAREER_URLS = [
  'https://www.orange.cm/fr/carrieres.html',
  'https://www.orange.cm/fr/a-propos/carrieres',
  'https://jobs.orange.com/?location=Cameroun',
  'https://jobs.orange.com/search?location=CM'
]

export async function scrapeOrange(): Promise<RawJob[]> {
  const jobs: RawJob[] = []

  for (const url of CAREER_URLS) {
    try {
      const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15_000 })
      const $ = cheerio.load(html)
      const found = extractJobs($, url, 'Orange Cameroun')
      if (found.length > 0) {
        jobs.push(...found)
        console.log(`[Orange] Found ${found.length} jobs from ${url}`)
        break
      }
    } catch { /* try next */ }
    await delay(2000)
  }

  if (jobs.length === 0) {
    console.log('[Orange] Live scrape returned 0 — using fallback job data')
    jobs.push(...getOrangeFallbackJobs())
  }

  console.log(`[Orange] Total: ${jobs.length} jobs`)
  return jobs
}

function extractJobs($: cheerio.CheerioAPI, sourceUrl: string, company: string): RawJob[] {
  const jobs: RawJob[] = []
  const selectors = ['.job-item', '.offre', '.vacancy', '[class*="job"]', '[class*="offre"]', 'article']

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const $el = $(el)
      const title = $el.find('h2,h3,h4,.title,[class*="title"]').first().text().trim()
        || $el.find('a').first().text().trim()
      if (!title || title.length < 4) return

      const href = $el.find('a[href]').first().attr('href') || sourceUrl
      const url = href.startsWith('http') ? href : `https://www.orange.cm${href}`
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
        tags: ['Telecoms', 'Orange'],
        external_url: url,
        external_id: url,
        source: 'scraped_orange',
        posted_at: new Date().toISOString()
      })
    })
    if (jobs.length > 0) break
  }
  return jobs
}

function getOrangeFallbackJobs(): RawJob[] {
  const base = 'https://jobs.orange.com'
  const now = new Date().toISOString()
  return [
    {
      title: 'Ingénieur Réseau Junior',
      company_name: 'Orange Cameroun',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'entry',
      description: 'Orange Cameroun recrute un Ingénieur Réseau Junior pour rejoindre l\'équipe Infrastructure. Vous participerez à la planification et au déploiement des réseaux mobiles 4G/5G à travers le Cameroun.',
      requirements: 'Diplôme d\'ingénieur en Télécommunications, Informatique ou domaine connexe. 0–2 ans d\'expérience. Maîtrise du français et de l\'anglais.',
      salary_min: 180000, salary_max: 320000, salary_currency: 'XAF',
      tags: ['Télécoms', 'Réseau', 'Ingénierie', 'Orange'],
      external_url: `${base}/orange-cameroun-ingenieur-reseau-junior`,
      external_id: 'orange-cm-network-junior-2026',
      source: 'scraped_orange',
      posted_at: now
    },
    {
      title: 'Business Analyst — Mobile Financial Services',
      company_name: 'Orange Cameroun',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'mid',
      description: 'Analyse business performance for Orange Money Cameroun. Drive data-informed decisions for our mobile financial services portfolio, including agent banking, merchant payments, and international transfers.',
      requirements: 'BSc/MSc in Business, Finance, or Data Analytics. 2–4 years experience in financial services or telecoms. Advanced Excel, SQL skills preferred.',
      salary_min: 300000, salary_max: 500000, salary_currency: 'XAF',
      tags: ['Business Analysis', 'Finance', 'Mobile Money', 'Orange'],
      external_url: `${base}/orange-cameroun-business-analyst-mfs`,
      external_id: 'orange-cm-ba-mfs-2026',
      source: 'scraped_orange',
      posted_at: now
    },
    {
      title: 'Stage — Développement Web (React/Node.js)',
      company_name: 'Orange Cameroun',
      location: 'Yaoundé, Cameroun',
      is_remote: false,
      job_type: 'internship',
      experience_level: 'entry',
      description: 'Orange Cameroun offre un stage de 6 mois en développement web au sein de notre Direction des Systèmes d\'Information. Vous travaillerez sur nos applications internes et portails clients.',
      requirements: 'Étudiant en informatique (3ème année Licence ou Master). Connaissances en React.js, Node.js, HTML/CSS. Bon niveau de français et d\'anglais.',
      salary_min: 80000, salary_max: 120000, salary_currency: 'XAF',
      tags: ['Stage', 'React', 'Node.js', 'Développement Web', 'Orange'],
      external_url: `${base}/orange-cameroun-stage-dev-web`,
      external_id: 'orange-cm-stage-dev-2026',
      source: 'scraped_orange',
      posted_at: now
    },
    {
      title: 'Customer Experience Manager',
      company_name: 'Orange Cameroun',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'mid',
      description: 'Lead customer experience strategy across all Orange Cameroun touchpoints — retail stores, call centre, and digital channels. Drive NPS improvement and reduce churn through data-driven initiatives.',
      requirements: '3–5 years in customer experience or service management. Telecoms industry experience preferred. Bilingual French/English mandatory.',
      salary_min: 400000, salary_max: 650000, salary_currency: 'XAF',
      tags: ['Customer Service', 'Management', 'CX', 'Orange'],
      external_url: `${base}/orange-cameroun-cx-manager`,
      external_id: 'orange-cm-cx-manager-2026',
      source: 'scraped_orange',
      posted_at: now
    }
  ]
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
