-- Маркиране дали часът е по здравна каса или частно
alter table public.appointments
  add column if not exists insurance text not null default 'private';

comment on column public.appointments.insurance is 'private | nhif';

