-- Разширена карта на пациента: адрес, ЕГН, имейл
alter table public.patients
  add column if not exists address text,
  add column if not exists egn text,
  add column if not exists email text;

create index if not exists idx_patients_email on public.patients (email);
