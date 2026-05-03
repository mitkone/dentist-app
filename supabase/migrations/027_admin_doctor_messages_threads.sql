-- Двупосочен чат: нишка (thread_id), от лекар (from_dentist_id) или от персонал (null).
-- Отговор от лекар към персонал: to_dentist_id = '__staff__' (специална стойност).
alter table public.admin_doctor_messages add column if not exists thread_id uuid;
alter table public.admin_doctor_messages add column if not exists from_dentist_id text;

update public.admin_doctor_messages
set thread_id = id
where thread_id is null;

alter table public.admin_doctor_messages alter column thread_id set not null;

comment on column public.admin_doctor_messages.thread_id is 'Една нишка за разговор персонал ↔ лекар';
comment on column public.admin_doctor_messages.from_dentist_id is 'Ако е попълнено – съобщение от този лекар; иначе от персонал/админ';
comment on column public.admin_doctor_messages.to_dentist_id is 'Получател: id на лекар или __staff__ за отговор към регистратура';
