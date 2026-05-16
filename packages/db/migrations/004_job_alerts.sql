-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keywords TEXT NOT NULL,
  location TEXT,
  job_type TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('instant', 'daily', 'weekly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_alerts_user ON job_alerts(user_id);
CREATE INDEX idx_job_alerts_active ON job_alerts(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON job_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT 'Job alerts table created ✅' AS status;
