# NexaWork 🌍
> "Your First Job Finds You" — Africa's AI-Powered Employment Platform

## ⚡ 5-Minute Local Setup

### Prerequisites
- Node.js 18+ and pnpm (`npm install -g pnpm`)
- Git

### Step 1 — Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/nexawork.git
cd nexawork
pnpm install
```

### Step 2 — Supabase Database
1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste and run `packages/db/migrations/001_initial_schema.sql`
3. Paste and run `packages/db/migrations/002_match_function.sql`
4. Go to **Settings → API** → copy your **Project URL** and **anon public** key and **service_role** key

### Step 3 — Environment Variables

**API** (`apps/api/.env`):
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
RAPIDAPI_KEY=your_rapidapi_key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Web** (`apps/web/.env.local`):
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3001
```

### Step 4 — Run
```bash
pnpm dev
```
- Frontend: http://localhost:5173
- API: http://localhost:3001
- Health check: http://localhost:3001/health

---

## 🏗️ Project Structure
```
nexawork/
├── apps/
│   ├── web/          # React + TypeScript + Vite (PWA)
│   └── api/          # Node.js + Fastify REST API
└── packages/
    └── db/
        └── migrations/   # SQL files for Supabase
```

## 🎨 Brand
- Primary: `#1A7A4A` (Rich Green)
- Accent: `#E8B84B` (Soft Gold)  
- Base: `#FFFFFF` (White)

## 🚀 Deploy
- Frontend → Vercel (connect GitHub repo, set env vars, auto-deploys)
- Backend → Render.com (connect GitHub repo, set env vars, auto-deploys)
"# nexawork-working" 
