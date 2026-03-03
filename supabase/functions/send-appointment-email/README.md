# Имейл при запис на час

При създаване на нов час лекарят получава имейл с детайлите (пациент, дата, час, вид преглед, телефон, имейл на пациента).

## Настройка

1. Регистрирай се в [Resend](https://resend.com) (безплатно до ~100 имейла/ден)
2. Създай API ключ в Resend Dashboard
3. В Supabase Dashboard → Edge Functions → `send-appointment-email` → Secrets:
   - `RESEND_API_KEY` = твоят Resend API ключ
   - (по избор) `RESEND_FROM_EMAIL` = имейл от който да се изпраща (напр. `noreply@tvojadomena.com`)

4. Деплой на функцията:
   ```bash
   supabase functions deploy send-appointment-email
   ```

## Как работи

- Лекарят трябва да има регистриран профил в `profiles` с `dentist_id` = id на лекаря
- Имейлът на лекаря се взима от `profiles.email` за профила с този `dentist_id`
- Ако няма такъв профил или няма имейл, изпращането се пропуска (без грешка)
