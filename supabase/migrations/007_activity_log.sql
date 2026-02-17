-- Лог на събития за админ панел
-- action: appointment_created, appointment_updated, appointment_deleted, vacation_added, vacation_deleted, patient_added, patient_updated, dentist_added, dentist_deleted, file_uploaded, file_deleted
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb
);

create index if not exists idx_activity_log_created_at on public.activity_log (created_at desc);
create index if not exists idx_activity_log_action on public.activity_log (action);

alter table public.activity_log enable row level security;

drop policy if exists "Allow all for anon" on public.activity_log;
create policy "Allow all for anon" on public.activity_log
  for all
  using (true)
  with check (true);
