-- Телефон за регистрация и детайлни права за профили

alter table public.profiles
  add column if not exists phone text,
  add column if not exists permissions jsonb default '{}';

comment on column public.profiles.phone is 'Телефонен номер – за бъдещо влизане с OTP';
comment on column public.profiles.permissions is 'Детайлни права: { can_view_all, can_book_all, can_edit_dentists, can_manage_profiles } – празен обект = използвай role';

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (true);
