-- Клиентът с anon key е с роля `anon` (напр. админ ПИН без Supabase login, или преди зареждане на сесията).
-- Без политика за `anon` INSERT хвърля: new row violates row-level security policy.
drop policy if exists "Allow all for anon" on public.admin_doctor_messages;
create policy "Allow all for anon" on public.admin_doctor_messages
  for all to anon
  using (true)
  with check (true);
