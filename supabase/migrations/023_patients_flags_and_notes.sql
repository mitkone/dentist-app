-- Родителски телефон, черен списък, индикация „нередовен“, бележки по лекар (JSON)
alter table public.patients
  add column if not exists parent_phone text,
  add column if not exists is_blacklisted boolean not null default false,
  add column if not exists unreliable_patient boolean not null default false,
  add column if not exists dentist_notes jsonb not null default '{}'::jsonb;

comment on column public.patients.dentist_notes is 'Ключове dentist_id за произволен текст: бележка към този лекар';

-- По избор връзка към пациента (за записи от базата)
alter table public.appointments
  add column if not exists patient_id uuid references public.patients (id);

create index if not exists idx_appointments_patient_id on public.appointments (patient_id);
