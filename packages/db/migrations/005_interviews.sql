-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL,
  seeker_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES jobs(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'phone', 'in_person')),
  location TEXT,
  meeting_link TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_application ON interviews(application_id);
CREATE INDEX idx_interviews_seeker ON interviews(seeker_id);
CREATE INDEX idx_interviews_employer ON interviews(employer_id);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employers manage interviews" ON interviews FOR ALL TO authenticated
  USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Seekers view own interviews" ON interviews FOR SELECT TO authenticated
  USING (auth.uid() = seeker_id);

SELECT 'Interviews table created ✅' AS status;
