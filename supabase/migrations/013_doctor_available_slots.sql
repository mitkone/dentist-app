-- Свободни часове по лекар за дата – лекарът фиксира кои слотове са свободни за записване

create table if not exists public.doctor_available_slots (
  id uuid primary key default gen_random_uuid(),
  dentist_id text not null,
  date date not null,
  slots text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dentist_id, date)
);

create index if not exists idx_doctor_available_slots_dentist_date on public.doctor_available_slots (dentist_id, date);

alter table public.doctor_available_slots enable row level security;

drop policy if exists "Allow all for doctor_available_slots" on public.doctor_available_slots;
create policy "Allow all for doctor_available_slots" on public.doctor_available_slots
  for all using (true) with check (true);

comment on table public.doctor_available_slots is 'Фиксирани свободни часове по лекар за ден – slots са масив от "09:00", "09:30" и т.н.';
