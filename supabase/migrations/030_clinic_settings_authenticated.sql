-- Влезли потребители (authenticated) трябва да могат да четат/записват clinic_settings
-- (напр. dentists_list). Без това upsert от staff акаунт се проваля тихо.
drop policy if exists "Allow all for authenticated" on public.clinic_settings;
create policy "Allow all for authenticated" on public.clinic_settings
  for all to authenticated
  using (true)
  with check (true);
