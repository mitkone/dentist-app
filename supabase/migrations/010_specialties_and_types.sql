-- Специалности за лекари и видове преглед (управляеми от админ)
create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label_bg text not null
);

create table if not exists public.appointment_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label_bg text not null
);

alter table public.specialties enable row level security;
alter table public.appointment_types enable row level security;
drop policy if exists "Allow all for anon" on public.specialties;
create policy "Allow all for anon" on public.specialties for all using (true) with check (true);
drop policy if exists "Allow all for anon" on public.appointment_types;
create policy "Allow all for anon" on public.appointment_types for all using (true) with check (true);

-- Начални стойности
insert into public.specialties (key, label_bg) values
  ('General Dentistry', 'Обща стоматология'),
  ('Orthodontics', 'Ортодонтия'),
  ('Pediatric Dentistry', 'Детска стоматология'),
  ('Oral Surgery', 'Орална хирургия')
on conflict (key) do nothing;

insert into public.appointment_types (key, label_bg) values
  ('Checkup', 'Преглед'),
  ('Filling', 'Пломба'),
  ('Extraction', 'Вадене'),
  ('Consultation', 'Консултация'),
  ('Follow-up', 'Контролен преглед'),
  ('Cleaning', 'Почистка')
on conflict (key) do nothing;
