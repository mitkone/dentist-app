-- Профили за регистрация: лекари и регистратори
-- Свързва auth.users с роля (admin, dentist, receptionist) и при нужда dentist_id

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('admin', 'dentist', 'receptionist')),
  dentist_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_dentist_id on public.profiles (dentist_id);

alter table public.profiles enable row level security;

drop policy if exists "Public read profiles" on public.profiles;
create policy "Public read profiles" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Тригер: при регистрация създай профил (извиква се от приложението или Edge Function)
-- За ръчно създаване: insert в profiles след signUp

comment on table public.profiles is 'Потребителски профили за лекари и регистратори';
