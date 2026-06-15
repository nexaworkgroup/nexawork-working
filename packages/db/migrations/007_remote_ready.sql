-- Remote Ready Badge for NexaWork
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS remote_ready (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- Speed test sessions (need 3 to qualify)
  speed_sessions  JSONB DEFAULT '[]'::jsonb,
  sessions_count  INTEGER DEFAULT 0,
  avg_speed_mbps  NUMERIC(8,2),
  -- Power backup video
  power_video_url TEXT,
  video_status    TEXT DEFAULT 'none' CHECK (video_status IN ('none','pending','approved','rejected')),
  video_notes     TEXT,
  -- Badge state
  badge_active    BOOLEAN DEFAULT false,
  submitted_at    TIMESTAMPTZ,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Add remote_ready_active to seeker profile for quick badge lookup on job cards
ALTER TABLE profiles_seeker
  ADD COLUMN IF NOT EXISTS remote_ready_active BOOLEAN DEFAULT false;

-- Storage bucket for power backup videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('remote-ready-videos', 'remote-ready-videos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE remote_ready ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_remote_ready" ON remote_ready;
CREATE POLICY "users_own_remote_ready" ON remote_ready
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_remote_ready" ON remote_ready;
CREATE POLICY "admin_all_remote_ready" ON remote_ready
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin')
  );

SELECT 'Remote Ready schema created ✅' AS status;
