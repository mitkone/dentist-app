# Създаване на таблицата в Supabase

Грешката **"Could not find the table 'public.appointments'"** означава, че таблицата още не е създадена.

## Стъпки

1. Влез в [Supabase Dashboard](https://supabase.com/dashboard) и отвори проекта си.
2. От ляво избери **SQL Editor**.
3. Натисни **New query**.
4. Копирай и постави целия код по-долу.
5. Натисни **Run** (или Ctrl+Enter).

## SQL скрипт

```sql
-- Таблица за часове
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_name text not null,
  dentist_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled'
);

create index if not exists idx_appointments_start_time on public.appointments (start_time);
create index if not exists idx_appointments_dentist_id on public.appointments (dentist_id);

alter table public.appointments enable row level security;

drop policy if exists "Allow all for anon" on public.appointments;
create policy "Allow all for anon" on public.appointments
  for all
  using (true)
  with check (true);
```

6. След успешно изпълнение презареди приложението – грешката за таблицата ще изчезне и часовете ще се зареждат от базата.

---

## Таблица за пациенти (име, телефон, бележки)

За да ползвате пациенти от базата (търсене, телефон, бележки), пуснете и миграцията за пациенти:

**SQL Editor** → New query → поставете съдържанието на **`supabase/migrations/002_patients.sql`** → Run.

---

## Файлове за пациенти (качване / преглед)

1. **Таблица за файлове:** SQL Editor → поставете **`supabase/migrations/005_patient_files.sql`** → Run.
2. **Storage bucket:** В Dashboard отвори **Storage** → **New bucket** → име: **`patient-files`**, включи **Public bucket** → Create.
3. **Политики за Storage:** SQL Editor → поставете **`supabase/migrations/006_storage_patient_files.sql`** → Run.

След това в „Данни за пациента“ ще се показва секция „Файлове“ с възможност за качване и изтриване.

---

## Лог на събития (админ панел)

За да се записват действия и да работи бутонът **Админ** в хедъра: SQL Editor → поставете **`supabase/migrations/007_activity_log.sql`** → Run.

---

## Допълнителни миграции (по избор)

- **008_appointments_notes_attendance.sql** – колони за бележки по часа и дали пациентът е дошъл (notes, attendance).
- **009_clinic_settings.sql** – настройки на клиниката (работни часове); след това в Админ панела можете да задавате начало/край на работния ден.
- **010_specialties_and_types.sql** – таблици за специалности (лекари) и видове преглед; от Админ панела можете да добавяте/изтривате опции.
- **011_appointments_insurance.sql** – отбелязване дали часът е по здравна каса (`insurance = 'nhif'`) или частно (`'private'`).
