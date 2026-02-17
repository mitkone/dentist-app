-- Файлове за пациенти: връзка между пациент и файл в Storage
-- patient_id съответства на id от приложението (uuid или локален идентификатор)
create table if not exists public.patient_files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_id text not null,
  file_name text not null,
  storage_path text not null,
  content_type text
);

create index if not exists idx_patient_files_patient_id on public.patient_files (patient_id);

alter table public.patient_files enable row level security;

drop policy if exists "Allow all for anon" on public.patient_files;
create policy "Allow all for anon" on public.patient_files
  for all
  using (true)
  with check (true);

-- След това създайте bucket "patient-files" и пуснете 006_storage_patient_files.sql (вижте SUPABASE_SETUP.md).
