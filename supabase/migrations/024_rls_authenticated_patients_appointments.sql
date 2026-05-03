-- Явни политики за влезли потребители (Supabase JWT role authenticated).
-- Без тях запис може да е позволен само за anon, а клиентът праща Bearer token.
drop policy if exists "Allow all for authenticated" on public.appointments;
create policy "Allow all for authenticated" on public.appointments
  for all to authenticated
  using (true)
  with check (true);

drop policy if exists "Allow all for authenticated" on public.patients;
create policy "Allow all for authenticated" on public.patients
  for all to authenticated
  using (true)
  with check (true);
