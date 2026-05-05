-- Profile photos for dentists (keyed by dentist_id string from clinic config)
create table if not exists public.dentist_photos (
  dentist_id text primary key,
  storage_path text not null,
  updated_at timestamptz not null default now()
);

comment on table public.dentist_photos is 'Stores the storage path for each dentist profile photo. dentist_id matches the id used in clinic config (e.g. d1, d2 or uuid).';

alter table public.dentist_photos enable row level security;

drop policy if exists "Allow all dentist_photos" on public.dentist_photos;
create policy "Allow all dentist_photos" on public.dentist_photos
  for all using (true) with check (true);

-- Storage bucket for dentist avatar images (public)
insert into storage.buckets (id, name, public)
  values ('dentist-avatars', 'dentist-avatars', true)
  on conflict (id) do nothing;

drop policy if exists "Public read dentist-avatars" on storage.objects;
create policy "Public read dentist-avatars" on storage.objects
  for select using (bucket_id = 'dentist-avatars');

drop policy if exists "Allow insert dentist-avatars" on storage.objects;
create policy "Allow insert dentist-avatars" on storage.objects
  for insert with check (bucket_id = 'dentist-avatars');

drop policy if exists "Allow update dentist-avatars" on storage.objects;
create policy "Allow update dentist-avatars" on storage.objects
  for update using (bucket_id = 'dentist-avatars');

drop policy if exists "Allow delete dentist-avatars" on storage.objects;
create policy "Allow delete dentist-avatars" on storage.objects
  for delete using (bucket_id = 'dentist-avatars');
