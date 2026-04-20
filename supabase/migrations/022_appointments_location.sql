-- Локация/кабинет за конкретния преглед
alter table if exists public.appointments
  add column if not exists location text;

comment on column public.appointments.location is 'Кабинет за прегледа (Нови Искър / Дружба)';
