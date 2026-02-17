-- Настройки на клиниката (работни часове и др.)
create table if not exists public.clinic_settings (
  key text primary key,
  value text not null
);

alter table public.clinic_settings enable row level security;
drop policy if exists "Allow all for anon" on public.clinic_settings;
create policy "Allow all for anon" on public.clinic_settings for all using (true) with check (true);

-- По подразбиране: 7:00 - 19:00
insert into public.clinic_settings (key, value) values ('working_hours_start', '7'), ('working_hours_end', '19')
on conflict (key) do nothing;
