-- Съобщения от администрация/регистратура към конкретен лекар (без връзка с пациент).
create table if not exists public.admin_doctor_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  to_dentist_id text not null,
  body text not null,
  from_label text,
  read_at timestamptz
);

create index if not exists idx_admin_doctor_messages_to_dentist
  on public.admin_doctor_messages (to_dentist_id, created_at desc);

alter table public.admin_doctor_messages enable row level security;

drop policy if exists "Allow all for authenticated" on public.admin_doctor_messages;
create policy "Allow all for authenticated" on public.admin_doctor_messages
  for all to authenticated
  using (true)
  with check (true);

alter table public.admin_doctor_messages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'admin_doctor_messages'
  ) then
    alter publication supabase_realtime add table public.admin_doctor_messages;
  end if;
end $$;
