-- Replica identity full: needed for DELETE notifications - PostgreSQL must send dentist_id in old record.
-- Run: npx supabase db push  OR  paste in Supabase Dashboard → SQL Editor → Run
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
