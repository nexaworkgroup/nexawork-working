-- ============================================================
-- NexaWork — Initial Database Schema
-- Run this in Supabase SQL Editor (nexawork project)
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Enums
CREATE TYPE user_role        AS ENUM ('job_seeker', 'employer', 'admin');
CREATE TYPE lang_pref        AS ENUM ('en', 'fr');
CREATE TYPE company_size_t   AS ENUM ('1-10', '11-50', '51-200', '201-1000', '1000+');
CREATE TYPE job_source_t     AS ENUM ('native','jsearch','scraped_google','scraped_mtn','scraped_orange','scraped_camerajob','scraped_emploicm','scraped_other');
CREATE TYPE job_type_t       AS ENUM ('full_time','part_time','internship','contract','graduate_scheme');
CREATE TYPE exp_level_t      AS ENUM ('entry','mid','senior','executive','any');
CREATE TYPE app_status_t     AS ENUM ('applied','viewed','shortlisted','interview','offered','rejected');

-- ============================================================
-- 4. TABLES
-- ============================================================

-- users (mirrors auth.users — role + language stored here)
CREATE TABLE users (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email            VARCHAR(255) UNIQUE NOT NULL,
  role             user_role NOT NULL DEFAULT 'job_seeker',
  lang_preference  lang_pref DEFAULT 'en',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- seeker profiles
CREATE TABLE profiles_seeker (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name        VARCHAR(200) NOT NULL DEFAULT '',
  avatar_url       TEXT,
  location         VARCHAR(200),
  degree           VARCHAR(200),
  field_of_study   VARCHAR(200),
  institution      VARCHAR(300),
  graduation_year  SMALLINT,
  bio              TEXT,
  cv_url           TEXT,
  embedding        VECTOR(1536),
  profile_strength SMALLINT DEFAULT 0,
  is_open_to_work  BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- employer profiles
CREATE TABLE profiles_employer (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name  VARCHAR(300) NOT NULL DEFAULT '',
  logo_url      TEXT,
  industry      VARCHAR(200),
  company_size  company_size_t,
  location      VARCHAR(200),
  website       TEXT,
  description   TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- skills taxonomy
CREATE TABLE skills (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name      VARCHAR(100) NOT NULL UNIQUE,
  category  VARCHAR(100),
  label_en  VARCHAR(100),
  label_fr  VARCHAR(100)
);

-- seeker <-> skills (many-to-many)
CREATE TABLE seeker_skills (
  seeker_id         UUID REFERENCES profiles_seeker(id) ON DELETE CASCADE,
  skill_id          UUID REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level SMALLINT DEFAULT 1,
  PRIMARY KEY (seeker_id, skill_id)
);

-- jobs (native + aggregated)
CREATE TABLE jobs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id      UUID REFERENCES profiles_employer(id) ON DELETE SET NULL,
  source           job_source_t NOT NULL DEFAULT 'native',
  external_id      TEXT,
  external_url     TEXT UNIQUE,
  title            VARCHAR(300) NOT NULL,
  company_name     VARCHAR(300) NOT NULL,
  location         VARCHAR(200),
  is_remote        BOOLEAN DEFAULT FALSE,
  job_type         job_type_t,
  experience_level exp_level_t DEFAULT 'any',
  description      TEXT,
  requirements     TEXT,
  salary_min       INTEGER,
  salary_max       INTEGER,
  salary_currency  CHAR(3) DEFAULT 'XAF',
  embedding        VECTOR(1536),
  tags             TEXT[],
  is_active        BOOLEAN DEFAULT TRUE,
  posted_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- applications
CREATE TABLE applications (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id      UUID REFERENCES profiles_seeker(id) ON DELETE CASCADE NOT NULL,
  job_id         UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  status         app_status_t DEFAULT 'applied',
  cover_letter   TEXT,
  ai_match_score FLOAT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seeker_id, job_id)
);

-- saved jobs
CREATE TABLE saved_jobs (
  seeker_id  UUID REFERENCES profiles_seeker(id) ON DELETE CASCADE,
  job_id     UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (seeker_id, job_id)
);

-- job views (implicit CF feedback — future use)
CREATE TABLE job_views (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_id  UUID REFERENCES profiles_seeker(id) ON DELETE CASCADE,
  job_id     UUID REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications
CREATE TABLE notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type       VARCHAR(50),
  title      VARCHAR(300),
  message    TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- chatbot conversation history
CREATE TABLE chat_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX idx_jobs_embedding       ON jobs           USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_seeker_embedding     ON profiles_seeker USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX idx_jobs_active_date     ON jobs            (is_active, posted_at DESC);
CREATE INDEX idx_applications_seeker  ON applications    (seeker_id);
CREATE INDEX idx_applications_job     ON applications    (job_id);
CREATE INDEX idx_notifications_user   ON notifications   (user_id, is_read);
CREATE INDEX idx_chat_user            ON chat_messages   (user_id, created_at DESC);

-- ============================================================
-- 6. TRIGGERS (updated_at)
-- ============================================================
CREATE TRIGGER trg_users_updated        BEFORE UPDATE ON users              FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_seeker_updated       BEFORE UPDATE ON profiles_seeker    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_employer_updated     BEFORE UPDATE ON profiles_employer  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_jobs_updated         BEFORE UPDATE ON jobs               FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications       FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- 7. AUTO-CREATE USER RECORD + PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role;
BEGIN
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'job_seeker'
  );

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, user_role_val)
  ON CONFLICT (id) DO NOTHING;

  IF user_role_val = 'job_seeker' THEN
    INSERT INTO public.profiles_seeker (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role_val = 'employer' THEN
    INSERT INTO public.profiles_employer (user_id, company_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'company_name', ''))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_seeker   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_employer ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_skills     ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills            ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own"  ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"  ON users FOR UPDATE USING (auth.uid() = id);

-- seeker profiles
CREATE POLICY "seeker_select_own"      ON profiles_seeker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "seeker_insert_own"      ON profiles_seeker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "seeker_update_own"      ON profiles_seeker FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "employer_view_seekers"  ON profiles_seeker FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'employer')
);

-- employer profiles (public readable)
CREATE POLICY "employer_all_own"       ON profiles_employer FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "employer_public_select" ON profiles_employer FOR SELECT USING (TRUE);

-- jobs (active jobs public; employers manage own)
CREATE POLICY "jobs_public_select"  ON jobs FOR SELECT USING (is_active = TRUE);
CREATE POLICY "jobs_employer_all"   ON jobs FOR ALL USING (
  employer_id IN (SELECT id FROM profiles_employer WHERE user_id = auth.uid())
);

-- applications
CREATE POLICY "apps_seeker_all"       ON applications FOR ALL USING (
  seeker_id IN (SELECT id FROM profiles_seeker WHERE user_id = auth.uid())
);
CREATE POLICY "apps_employer_select"  ON applications FOR SELECT USING (
  job_id IN (SELECT id FROM jobs WHERE employer_id IN (SELECT id FROM profiles_employer WHERE user_id = auth.uid()))
);
CREATE POLICY "apps_employer_update"  ON applications FOR UPDATE USING (
  job_id IN (SELECT id FROM jobs WHERE employer_id IN (SELECT id FROM profiles_employer WHERE user_id = auth.uid()))
);

-- saved jobs
CREATE POLICY "saved_seeker_all" ON saved_jobs FOR ALL USING (
  seeker_id IN (SELECT id FROM profiles_seeker WHERE user_id = auth.uid())
);

-- notifications
CREATE POLICY "notif_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- chat
CREATE POLICY "chat_own" ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- seeker skills
CREATE POLICY "sskills_seeker_all"    ON seeker_skills FOR ALL USING (
  seeker_id IN (SELECT id FROM profiles_seeker WHERE user_id = auth.uid())
);
CREATE POLICY "sskills_public_select" ON seeker_skills FOR SELECT USING (TRUE);

-- skills taxonomy (public read-only)
CREATE POLICY "skills_public_select" ON skills FOR SELECT USING (TRUE);

-- ============================================================
-- 9. SEED — Skills Taxonomy (50 skills)
-- ============================================================
INSERT INTO skills (name, category, label_en, label_fr) VALUES
('JavaScript',          'Technology',  'JavaScript',           'JavaScript'),
('TypeScript',          'Technology',  'TypeScript',           'TypeScript'),
('Python',              'Technology',  'Python',               'Python'),
('Java',                'Technology',  'Java',                 'Java'),
('React',               'Technology',  'React',                'React'),
('Node.js',             'Technology',  'Node.js',              'Node.js'),
('SQL',                 'Technology',  'SQL',                  'SQL'),
('PostgreSQL',          'Technology',  'PostgreSQL',           'PostgreSQL'),
('MySQL',               'Technology',  'MySQL',                'MySQL'),
('MongoDB',             'Technology',  'MongoDB',              'MongoDB'),
('Docker',              'Technology',  'Docker',               'Docker'),
('AWS',                 'Technology',  'AWS',                  'AWS'),
('Git',                 'Technology',  'Git',                  'Git'),
('Linux',               'Technology',  'Linux',                'Linux'),
('Flutter',             'Technology',  'Flutter',              'Flutter'),
('PHP',                 'Technology',  'PHP',                  'PHP'),
('C/C++',               'Technology',  'C/C++',                'C/C++'),
('Machine Learning',    'Technology',  'Machine Learning',     'Apprentissage automatique'),
('Data Science',        'Technology',  'Data Science',         'Science des données'),
('Cybersecurity',       'Technology',  'Cybersecurity',        'Cybersécurité'),
('Networking',          'Technology',  'Networking',           'Réseaux'),
('Project Management',  'Business',   'Project Management',   'Gestion de projet'),
('Business Analysis',   'Business',   'Business Analysis',    'Analyse commerciale'),
('Marketing',           'Business',   'Marketing',            'Marketing'),
('Sales',               'Business',   'Sales',                'Vente'),
('Finance',             'Business',   'Finance',              'Finance'),
('Accounting',          'Business',   'Accounting',           'Comptabilité'),
('Human Resources',     'Business',   'Human Resources',      'Ressources humaines'),
('Customer Service',    'Business',   'Customer Service',     'Service client'),
('Supply Chain',        'Business',   'Supply Chain',         'Chaîne logistique'),
('Entrepreneurship',    'Business',   'Entrepreneurship',     'Entrepreneuriat'),
('English',             'Languages',  'English',              'Anglais'),
('French',              'Languages',  'French',               'Français'),
('Spanish',             'Languages',  'Spanish',              'Espagnol'),
('Communication',       'Soft Skills','Communication',        'Communication'),
('Leadership',          'Soft Skills','Leadership',           'Leadership'),
('Problem Solving',     'Soft Skills','Problem Solving',      'Résolution de problèmes'),
('Teamwork',            'Soft Skills','Teamwork',             'Travail en équipe'),
('Critical Thinking',   'Soft Skills','Critical Thinking',    'Pensée critique'),
('Adaptability',        'Soft Skills','Adaptability',         'Adaptabilité'),
('Civil Engineering',   'Engineering','Civil Engineering',    'Génie civil'),
('Mechanical Eng.',     'Engineering','Mechanical Engineering','Génie mécanique'),
('Electrical Eng.',     'Engineering','Electrical Engineering','Génie électrique'),
('Telecoms',            'Engineering','Telecommunications',   'Télécommunications'),
('Nursing',             'Health',     'Nursing',              'Soins infirmiers'),
('Public Health',       'Health',     'Public Health',        'Santé publique'),
('Pharmacy',            'Health',     'Pharmacy',             'Pharmacie'),
('Teaching',            'Education',  'Teaching',             'Enseignement'),
('Research',            'Education',  'Research',             'Recherche'),
('Graphic Design',      'Creative',   'Graphic Design',       'Design graphique'),
('Video Editing',       'Creative',   'Video Editing',        'Montage vidéo'),
('Content Writing',     'Creative',   'Content Writing',      'Rédaction de contenu'),
('Social Media',        'Creative',   'Social Media',         'Réseaux sociaux');

-- Done! ✅
SELECT 'NexaWork database schema created successfully 🚀' AS status;
