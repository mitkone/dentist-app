-- Локация по лекар и ден (напр. "Дружба", "Нови Искър")
alter table if exists public.doctor_available_slots
  add column if not exists location text;

comment on column public.doctor_available_slots.location is 'Локация на лекаря за деня (напр. Дружба/Нови Искър)';
