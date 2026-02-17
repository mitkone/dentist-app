-- Пациенти: име, телефон, бележки
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text,
  notes text
);

create index if not exists idx_patients_name on public.patients (name);
create index if not exists idx_patients_phone on public.patients (phone);

alter table public.patients enable row level security;

drop policy if exists "Allow all for anon" on public.patients;
create policy "Allow all for anon" on public.patients
  for all
  using (true)
  with check (true);
