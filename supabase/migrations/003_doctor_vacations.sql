-- Отпуски на лекари: dentist_id съответства на id от приложението (напр. d-123)
create table if not exists public.doctor_vacations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  dentist_id text not null,
  start_date date not null,
  end_date date not null,
  note text
);

create index if not exists idx_doctor_vacations_dentist_id on public.doctor_vacations (dentist_id);
create index if not exists idx_doctor_vacations_dates on public.doctor_vacations (start_date, end_date);

alter table public.doctor_vacations enable row level security;

drop policy if exists "Allow all for anon" on public.doctor_vacations;
create policy "Allow all for anon" on public.doctor_vacations
  for all
  using (true)
  with check (true);
