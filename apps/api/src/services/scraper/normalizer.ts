// Canonical shape every scraper must produce
export interface RawJob {
  title: string
  company_name: string
  location: string | null
  is_remote: boolean
  job_type: 'full_time' | 'part_time' | 'internship' | 'contract' | 'graduate_scheme' | null
  experience_level: 'entry' | 'mid' | 'senior' | 'executive' | 'any'
  description: string | null
  requirements: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  tags: string[]
  external_url: string        // UNIQUE KEY — used for dedup
  external_id: string | null
  source: string
  posted_at: string           // ISO date string
}

// Infer job_type from title keywords
export function inferJobType(title: string, description = ''): RawJob['job_type'] {
  const text = (title + ' ' + description).toLowerCase()
  if (/\b(intern|internship|stage|stagiaire)\b/.test(text)) return 'internship'
  if (/\b(graduate|grad scheme|jeune diplômé|entry.?level)\b/.test(text)) return 'graduate_scheme'
  if (/\b(part.?time|mi.?temps|temps partiel)\b/.test(text)) return 'part_time'
  if (/\b(contract|freelance|consultant|mission)\b/.test(text)) return 'contract'
  return 'full_time'
}

// Infer experience level from title/description
export function inferLevel(title: string, description = ''): RawJob['experience_level'] {
  const text = (title + ' ' + description).toLowerCase()
  if (/\b(senior|sr\.|lead|principal|head|director|manager|chef)\b/.test(text)) return 'senior'
  if (/\b(junior|jr\.|entry|entry.?level|graduate|intern|débutant|jeune)\b/.test(text)) return 'entry'
  if (/\b(executive|vp|vice president|cto|ceo|cfo|directeur général)\b/.test(text)) return 'executive'
  if (/\b(mid|intermediate|confirmé|expérimenté)\b/.test(text)) return 'mid'
  return 'any'
}

// Detect remote from text
export function inferRemote(title: string, description = ''): boolean {
  const text = (title + ' ' + description).toLowerCase()
  return /\b(remote|télétravail|teletravail|work from home|wfh|anywhere)\b/.test(text)
}

// Normalise a date string to ISO
export function normaliseDate(raw: string | null | undefined): string {
  if (!raw) return new Date().toISOString()
  try { return new Date(raw).toISOString() } catch { return new Date().toISOString() }
}

// Clean HTML tags from description text
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
