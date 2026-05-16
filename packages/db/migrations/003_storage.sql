-- Run in Supabase SQL Editor
-- Creates public storage bucket for profile photos and CVs

INSERT INTO storage.buckets (id, name, public)
VALUES ('nexawork-files', 'nexawork-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
CREATE POLICY "Users upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nexawork-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to read all files
CREATE POLICY "Public read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'nexawork-files');

-- Allow users to update/delete their own files
CREATE POLICY "Users manage own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'nexawork-files' AND auth.uid()::text = (storage.foldername(name))[1]);

SELECT 'Storage bucket created ✅' AS status;
