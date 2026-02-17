-- Бележки за часа и дали пациентът е дошъл
alter table public.appointments
  add column if not exists notes text,
  add column if not exists attendance text not null default 'pending';

comment on column public.appointments.attendance is 'pending | showed | no_show';
