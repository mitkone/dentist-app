-- Appointments table for dental clinic scheduling
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_name text not null,
  dentist_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled'
);

-- Optional: index for listing by date/dentist
create index if not exists idx_appointments_start_time on public.appointments (start_time);
create index if not exists idx_appointments_dentist_id on public.appointments (dentist_id);

-- Enable RLS (Row Level Security) – adjust policies to your auth needs
alter table public.appointments enable row level security;

-- Example: allow all for anon (replace with your auth policy in production)
drop policy if exists "Allow all for anon" on public.appointments;
create policy "Allow all for anon" on public.appointments
  for all
  using (true)
  with check (true);
