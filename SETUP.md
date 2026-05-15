# NexaWork — Setup Guide
## Get running in 15 minutes

---

## Prerequisites (you already have these)
- Node.js installed
- Git installed
- VS Code installed
- Accounts on: Supabase, Vercel, Render.com, RapidAPI, OpenAI

---

## Step 1 — Install pnpm

Open terminal in VS Code and run:
```bash
npm install -g pnpm
```

---

## Step 2 — Install dependencies

```bash
cd nexawork
pnpm install
```

---

## Step 3 — Supabase Setup

1. Go to supabase.com → Your project → **SQL Editor**
2. Paste and run `packages/db/migrations/001_initial_schema.sql` → Click Run
3. Paste and run `packages/db/migrations/002_match_function.sql` → Click Run
4. Go to **Settings → API** → Copy:
   - Project URL → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Authentication → Providers → Google** → Enable it
   - Follow Supabase docs for Google OAuth setup (takes 5 min)

---

## Step 4 — Create .env files

**API** (`apps/api/.env`):
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
RAPIDAPI_KEY=your_rapidapi_key
RESEND_API_KEY=your_resend_key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Web** (`apps/web/.env`):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
```

---

## Step 5 — Run the app

Open **two terminals** in VS Code:

**Terminal 1 — API:**
```bash
cd apps/api
pnpm dev
```
You should see: `🚀 NexaWork API running on http://localhost:3001`

**Terminal 2 — Web:**
```bash
cd apps/web
pnpm dev
```
You should see: `VITE ready at http://localhost:5173`

Open http://localhost:5173 in your browser.

---

## Step 6 — Test the full flow

1. Click **Get Started** → Register as a Job Seeker
2. Complete the 3-step onboarding (name, education, skills)
3. You land on the Dashboard → You should see job matches immediately
4. Click **AI Assistant** → Type "find me software jobs in Yaoundé"
5. Register a second account as **Employer** → Post a job
6. The job gets AI-embedded and appears in seeker feeds automatically

---

## Step 7 — Deploy (when ready)

**Frontend → Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel
cd apps/web
vercel
# Follow prompts, add environment variables in Vercel dashboard
```

**Backend → Render.com:**
1. Create a new **Web Service** on render.com
2. Connect your GitHub repo
3. Root directory: `apps/api`
4. Build command: `pnpm install && pnpm build`
5. Start command: `node dist/index.js`
6. Add all environment variables from `apps/api/.env`

---

## Common Issues

**"Cannot find module"** → Run `pnpm install` from the root `/nexawork` folder

**"Supabase connection failed"** → Double-check your `.env` keys have no trailing spaces

**"pgvector not found"** → Go to Supabase SQL Editor and run: `CREATE EXTENSION IF NOT EXISTS vector;`

**Match feed shows 0 results** → Normal until jobs are embedded. Add a job via employer flow or wait for the scraper job to run.

**OpenAI errors** → Confirm your API key has credit. Check platform.openai.com/usage

---

## What's Built (MVP Complete ✅)

- ✅ Auth (Email + Google OAuth, role-based)
- ✅ Seeker onboarding (3 steps → instant AI match feed)
- ✅ Employer onboarding + job posting with AI improvement
- ✅ AI match feed using pgvector cosine similarity
- ✅ AI Chatbot (GPT-4o-mini, function calling, database-aware)
- ✅ AI CV Builder (5 questions → professional CV)
- ✅ Application system + ATS pipeline
- ✅ Job search with filters
- ✅ Bilingual EN/FR throughout
- ✅ PWA manifest (installable on mobile)
- ✅ Employer analytics dashboard
- ✅ Rate limiting + security headers

## Next: Job Aggregation Scraper
The scraper worker (`apps/scraper`) is the next file set to build.
It will pull real jobs from JSearch API + Cameroonian career pages
and embed them automatically.
