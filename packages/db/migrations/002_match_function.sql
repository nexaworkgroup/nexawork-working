-- Run this AFTER 001_initial_schema.sql
-- Creates the pgvector match function used by the feed API

CREATE OR REPLACE FUNCTION match_jobs(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 20,
  match_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  employer_id UUID,
  source job_source_t,
  external_url TEXT,
  title VARCHAR(300),
  company_name VARCHAR(300),
  location VARCHAR(200),
  is_remote BOOLEAN,
  job_type job_type_t,
  experience_level exp_level_t,
  description TEXT,
  requirements TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency CHAR(3),
  tags TEXT[],
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  match_score FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    j.id, j.employer_id, j.source, j.external_url, j.title,
    j.company_name, j.location, j.is_remote, j.job_type,
    j.experience_level, j.description, j.requirements,
    j.salary_min, j.salary_max, j.salary_currency,
    j.tags, j.posted_at, j.expires_at, j.created_at,
    ROUND(((1 - (j.embedding <=> query_embedding)) * 100)::numeric, 1)::float AS match_score
  FROM jobs j
  WHERE j.is_active = TRUE
    AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count
  OFFSET match_offset;
$$;

-- Allow public access to this function
GRANT EXECUTE ON FUNCTION match_jobs TO anon, authenticated;

SELECT 'match_jobs function created ✅' AS status;
