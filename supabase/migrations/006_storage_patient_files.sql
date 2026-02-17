-- Политики за Storage bucket "patient-files"
-- Първо създайте bucket в Dashboard: Storage → New bucket → име: patient-files, Public: включено.
-- След това пуснете този скрипт в SQL Editor.

-- Позволяване на качване (INSERT) в bucket patient-files
drop policy if exists "Allow anon upload patient-files" on storage.objects;
create policy "Allow anon upload patient-files"
  on storage.objects for insert
  with check (bucket_id = 'patient-files');

-- Позволяване на четене (SELECT) за публични файлове
drop policy if exists "Allow anon read patient-files" on storage.objects;
create policy "Allow anon read patient-files"
  on storage.objects for select
  using (bucket_id = 'patient-files');

-- Позволяване на изтриване (DELETE)
drop policy if exists "Allow anon delete patient-files" on storage.objects;
create policy "Allow anon delete patient-files"
  on storage.objects for delete
  using (bucket_id = 'patient-files');
