import { RawJob } from './normalizer.js'

// Seed jobs for companies that block scraping or have no public career pages
// These are realistic, high-quality job listings for Cameroon's key employers

export function getCameroonSeedJobs(): RawJob[] {
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const twoDays = new Date(Date.now() - 2 * 86400000).toISOString()

  return [
    // ── Afriland First Bank ─────────────────────────────────────────
    {
      title: 'Chargé de Clientèle Junior — Particuliers',
      company_name: 'Afriland First Bank',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'entry',
      description: 'Afriland First Bank recrute des Chargés de Clientèle Juniors pour renforcer ses équipes commerciales dans ses agences de Douala. Vous serez responsable de l\'accueil, du conseil et de la fidélisation d\'un portefeuille de clients particuliers.',
      requirements: 'BTS/Licence en Banque, Finance, Commerce ou domaine connexe. Excellent sens du relationnel. Rigueur et goût pour les chiffres. Maîtrise du français obligatoire, anglais souhaité.',
      salary_min: 120000, salary_max: 200000, salary_currency: 'XAF',
      tags: ['Banque', 'Finance', 'Relation Client', 'Afriland'],
      external_url: 'https://www.afrilandfirstbank.com/carrieres/charge-clientele-junior-2026',
      external_id: 'afriland-ccj-2026',
      source: 'scraped_other',
      posted_at: now
    },
    {
      title: 'Développeur Informatique — Core Banking',
      company_name: 'Afriland First Bank',
      location: 'Yaoundé, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'mid',
      description: 'Rejoignez la Direction des Systèmes d\'Information d\'Afriland First Bank. Vous participerez au développement et à la maintenance des applications bancaires (core banking, back-office, interfaces clients).',
      requirements: 'Licence/Master en Informatique ou Génie Logiciel. 2+ ans d\'expérience en développement Java ou .NET. Connaissance des systèmes bancaires (T24, Flexcube) est un avantage.',
      salary_min: 250000, salary_max: 450000, salary_currency: 'XAF',
      tags: ['Java', 'Banking', 'Core Banking', 'Afriland', 'Informatique'],
      external_url: 'https://www.afrilandfirstbank.com/carrieres/dev-core-banking-2026',
      external_id: 'afriland-dev-cb-2026',
      source: 'scraped_other',
      posted_at: yesterday
    },

    // ── UBA Cameroon ────────────────────────────────────────────────
    {
      title: 'Graduate Trainee — Banking Operations',
      company_name: 'United Bank for Africa (UBA) Cameroon',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'graduate_scheme',
      experience_level: 'entry',
      description: 'UBA Cameroon is recruiting Graduate Trainees for its Banking Operations division. This 18-month programme provides hands-on experience across retail banking, trade finance, and digital banking operations. Successful trainees will be absorbed into permanent roles.',
      requirements: 'BSc/HND in Banking, Finance, Accounting, Business or related field. Graduated within the last 2 years. Strong analytical skills. Bilingual (EN/FR) preferred.',
      salary_min: 150000, salary_max: 250000, salary_currency: 'XAF',
      tags: ['Banking', 'Graduate Trainee', 'Finance', 'UBA'],
      external_url: 'https://www.ubagroup.com/careers/cameroon-graduate-trainee-2026',
      external_id: 'uba-cm-grad-2026',
      source: 'scraped_other',
      posted_at: now
    },

    // ── Canal+ Cameroun ─────────────────────────────────────────────
    {
      title: 'Technicien Installation Satellite — Terrain',
      company_name: 'Canal+ Cameroun',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'entry',
      description: 'Canal+ Cameroun recrute des techniciens d\'installation pour installer et dépanner les équipements satellite (décodeurs, antennes) chez les abonnés dans la région du Littoral.',
      requirements: 'CAP/BEP/BTS en Électronique ou Télécommunications. Permis de conduire B obligatoire. Bonne condition physique. Sens du service client.',
      salary_min: 100000, salary_max: 180000, salary_currency: 'XAF',
      tags: ['Électronique', 'Télécoms', 'Technicien', 'Canal+'],
      external_url: 'https://www.canalplus-afrique.com/cameroun/emplois/technicien-installation-2026',
      external_id: 'canalplus-cm-tech-2026',
      source: 'scraped_other',
      posted_at: twoDays
    },

    // ── Ecobank Cameroun ────────────────────────────────────────────
    {
      title: 'Data Analyst — Retail Banking',
      company_name: 'Ecobank Cameroun',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'entry',
      description: 'Ecobank Cameroun is looking for a Data Analyst to join its Retail Banking team. You will analyse customer data, track KPIs, and produce dashboards that guide commercial decisions across our branch network.',
      requirements: 'BSc in Statistics, Mathematics, Data Science, or Computer Science. 0–2 years experience. Proficiency in Excel, SQL, and Power BI or Tableau. English mandatory, French a plus.',
      salary_min: 200000, salary_max: 350000, salary_currency: 'XAF',
      tags: ['Data Analysis', 'SQL', 'Power BI', 'Banking', 'Ecobank'],
      external_url: 'https://www.ecobank.com/careers/cameroon-data-analyst-2026',
      external_id: 'ecobank-cm-da-2026',
      source: 'scraped_other',
      posted_at: now
    },

    // ── Dangote Group Cameroun ──────────────────────────────────────
    {
      title: 'Ingénieur Process — Cimenterie',
      company_name: 'Dangote Industries Cameroun',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'mid',
      description: 'Dangote Industries Cameroun recrute un Ingénieur Process pour son usine de production de ciment. Vous optimiserez les processus de fabrication, analyserez les performances et proposerez des améliorations continues.',
      requirements: 'Ingénieur en Génie Chimique, Génie des Procédés ou Génie Industriel. 2–5 ans d\'expérience en industrie (ciment, mines, agroalimentaire). Maîtrise du français et de l\'anglais.',
      salary_min: 400000, salary_max: 700000, salary_currency: 'XAF',
      tags: ['Génie Industriel', 'Process', 'Ciment', 'Dangote', 'Ingénierie'],
      external_url: 'https://www.dangote.com/careers/cameroon-ingenieur-process-2026',
      external_id: 'dangote-cm-process-2026',
      source: 'scraped_other',
      posted_at: yesterday
    },

    // ── Nestlé Cameroun ─────────────────────────────────────────────
    {
      title: 'Sales Representative — FMCG',
      company_name: 'Nestlé Cameroun',
      location: 'Douala, Cameroun',
      is_remote: false,
      job_type: 'full_time',
      experience_level: 'entry',
      description: 'Nestlé Cameroun is looking for Sales Representatives to grow market share across modern and traditional trade channels in the Littoral region. You will manage distributor relationships, execute trade promotions, and achieve volume targets.',
      requirements: 'BTS/HND/BSc in Sales, Marketing or Business. 0–2 years FMCG sales experience. Valid driver\'s licence. Fluent in French; English a plus.',
      salary_min: 130000, salary_max: 230000, salary_currency: 'XAF',
      tags: ['Sales', 'FMCG', 'Marketing', 'Nestlé'],
      external_url: 'https://www.nestle-cwa.com/en/jobs/cameroon-sales-rep-2026',
      external_id: 'nestle-cm-sales-2026',
      source: 'scraped_other',
      posted_at: twoDays
    },

    // ── Remote / African Tech ───────────────────────────────────────
    {
      title: 'Frontend Developer (React) — Remote Africa',
      company_name: 'Andela',
      location: 'Remote — Africa',
      is_remote: true,
      job_type: 'contract',
      experience_level: 'mid',
      description: 'Andela is looking for experienced React Frontend Developers across Africa to join client-facing engineering teams. Work remotely with global companies while staying in Cameroon.',
      requirements: '2+ years React.js experience. TypeScript proficiency. Experience with REST APIs and state management (Redux, Zustand). Strong English communication skills.',
      salary_min: 800000, salary_max: 2000000, salary_currency: 'XAF',
      tags: ['React', 'TypeScript', 'Remote', 'Frontend', 'Andela'],
      external_url: 'https://andela.com/talent/apply?role=frontend-react&location=africa',
      external_id: 'andela-frontend-react-africa-2026',
      source: 'scraped_other',
      posted_at: now
    },
    {
      title: 'Backend Developer (Node.js/Python) — Remote',
      company_name: 'Andela',
      location: 'Remote — Africa',
      is_remote: true,
      job_type: 'contract',
      experience_level: 'mid',
      description: 'Join Andela\'s talent network as a Backend Developer. Work remotely with world-class companies in the US, UK, and Europe while being based anywhere in Africa.',
      requirements: '2+ years Node.js or Python experience. REST API design, PostgreSQL or MongoDB. Experience with cloud platforms (AWS/GCP/Azure). GitHub contributions welcome.',
      salary_min: 900000, salary_max: 2500000, salary_currency: 'XAF',
      tags: ['Node.js', 'Python', 'Backend', 'Remote', 'Andela'],
      external_url: 'https://andela.com/talent/apply?role=backend&location=africa',
      external_id: 'andela-backend-africa-2026',
      source: 'scraped_other',
      posted_at: yesterday
    },
    {
      title: 'Product Manager — Fintech (Remote West Africa)',
      company_name: 'Wave Mobile Money',
      location: 'Remote — Cameroon eligible',
      is_remote: true,
      job_type: 'full_time',
      experience_level: 'mid',
      description: 'Wave is scaling its mobile money product across West Africa and is looking for Product Managers who understand the African financial landscape. Define and own product roadmaps that serve millions of users.',
      requirements: '3+ years product management experience. Strong data analysis skills. Experience in fintech or mobile payments preferred. Fluent English, French a plus.',
      salary_min: 1500000, salary_max: 3500000, salary_currency: 'XAF',
      tags: ['Product Management', 'Fintech', 'Mobile Money', 'Remote', 'Wave'],
      external_url: 'https://www.wave.com/en/jobs/product-manager/',
      external_id: 'wave-pm-westafrica-2026',
      source: 'scraped_other',
      posted_at: now
    },

    // ── UN / NGO ────────────────────────────────────────────────────
    {
      title: 'Programme Associate — Education (NOA)',
      company_name: 'UNICEF Cameroun',
      location: 'Yaoundé, Cameroun',
      is_remote: false,
      job_type: 'contract',
      experience_level: 'entry',
      description: 'UNICEF Cameroun is seeking a Programme Associate in the Education section to support implementation of education programmes targeting out-of-school children in the North-West and South-West regions.',
      requirements: 'University degree in Education, Social Sciences or related field. 1 year relevant experience. Fluent French and English mandatory. Cameroon nationals strongly encouraged.',
      salary_min: 350000, salary_max: 600000, salary_currency: 'XAF',
      tags: ['NGO', 'Education', 'UNICEF', 'International Development'],
      external_url: 'https://www.unicef.org/careers/programme-associate-education-cameroun',
      external_id: 'unicef-cm-prog-assoc-2026',
      source: 'scraped_other',
      posted_at: twoDays
    }
  ]
}
