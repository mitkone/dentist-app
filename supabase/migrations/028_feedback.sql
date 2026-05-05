-- Feedback / bug reports from doctors and staff to the admin
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_label text,
  from_dentist_id text,
  body text not null,
  category text not null default 'bug',
  status text not null default 'open',
  admin_reply text,
  replied_at timestamptz
);

comment on column public.feedback.category is 'bug | feature | question | other';
comment on column public.feedback.status is 'open | in_progress | resolved | closed';

alter table public.feedback enable row level security;

drop policy if exists "Allow all for anon feedback" on public.feedback;
create policy "Allow all for anon feedback" on public.feedback
  for all using (true) with check (true);

drop policy if exists "Allow all for authenticated feedback" on public.feedback;
create policy "Allow all for authenticated feedback" on public.feedback
  for all to authenticated using (true) with check (true);
