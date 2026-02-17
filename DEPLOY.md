# Качване на приложението онлайн (стъпка по стъпка)

Приложението е React + Vite и използва Supabase за база данни. Най-лесният начин за качване е чрез **Vercel** (безплатно).

---

## Предварителни изисквания

- Акаунт в [Supabase](https://supabase.com) с проект и **изпълнени миграции** (вижте `SUPABASE_SETUP.md` – таблиците за часове, пациенти, настройки и т.н. трябва да съществуват).
- Акаунт в [GitHub](https://github.com)
- Акаунт в [Vercel](https://vercel.com) (вход с GitHub)

---

## Стъпка 1: Подготовка на проекта

1. Отворете папката на проекта в терминал (PowerShell или CMD).
2. Проверете дали има файл **`.env`** с променливите:
   - `VITE_SUPABASE_URL` = URL на вашия Supabase проект
   - `VITE_SUPABASE_ANON_KEY` = anon (public) ключ от Supabase

   Ако нямате `.env`, създайте го (копирайте от `.env.example` ако има такъв).  
   **Важно:** Не качвайте `.env` в GitHub – той трябва да е в `.gitignore`.

3. Тествайте локално:
   ```bash
   npm install
   npm run build
   ```
   Ако `npm run build` минава без грешки, готови сте за следващата стъпка.

---

## Стъпка 2: Качване на кода в GitHub

1. Ако още нямате Git в проекта, инициализирайте:
   ```bash
   git init
   ```

2. Създайте файл **`.gitignore`** (ако липсва) и проверете да има:
   ```
   node_modules
   dist
   .env
   .env.local
   *.local
   ```

3. Добавете файловете и направете първи commit:
   ```bash
   git add .
   git commit -m "Готово за качване"
   ```

4. Влезте в [GitHub](https://github.com) и създайте **нов празен репозиторий** (New repository).  
   Име например: `dentist-app`. Не пипайте „Add README“ или други опции.

5. Свържете локалния проект с репозиторито и изпратете кода (сменете `YOUR_USERNAME` и `dentist-app` с вашите):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/dentist-app.git
   git branch -M main
   git push -u origin main
   ```

---

## Стъпка 3: Създаване на проект във Vercel

1. Влезте в [vercel.com](https://vercel.com) и натиснете **„Add New…“** → **„Project“**.

2. Изберете **„Import Git Repository“** и свържете GitHub акаунта си (ако още не е свързан).

3. Изберете репозиторито **dentist-app** (или както сте го кръстили) и натиснете **„Import“**.

4. В настройките на проекта:
   - **Framework Preset:** Vite (трябва да се разпознае автоматично).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

   Оставете Root Directory празно, освен ако приложението не е в подпапка.

5. **Environment Variables (много важно):**
   - Натиснете **„Environment Variables“**.
   - Добавете:
     - **Name:** `VITE_SUPABASE_URL`  
       **Value:** вашият Supabase URL (от Supabase Dashboard → Settings → API).
     - **Name:** `VITE_SUPABASE_ANON_KEY`  
       **Value:** вашият Supabase anon public key (също от Settings → API).
   - За всяка променлива изберете **Production**, **Preview** и **Development** (или поне Production).

6. Натиснете **„Deploy“**.

7. Изчакайте няколко минути. Ще получите линк от вида:  
   `https://dentist-app-xxxx.vercel.app`

---

## Стъпка 4: Проверка след качване

1. Отворете дадения от Vercel URL в браузър.
2. Проверете дали се зареждат часове и пациенти от Supabase (ако имате данни).
3. Ако има грешки в конзолата (F12), най-често причината е липсваща или грешна **Environment Variable** – върнете се в Vercel → Project → Settings → Environment Variables и ги поправете, след което **Redeploy** (Deployments → три точки при последния deploy → Redeploy).

---

## Стъпка 5: Домен (по избор)

- В **Vercel** → вашият проект → **Settings** → **Domains** можете да добавите свой домейн (например `dentist.vashodomen.bg`).
- Ако нямате домейн, можете да ползвате безплатния поддомейн на Vercel (например `hadjiev-dent.vercel.app`).

---

## Кратко напомняне

| Стъпка | Действие |
|--------|----------|
| 1 | `.env` с `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`, `npm run build` минава |
| 2 | `git init`, `.gitignore` (с `.env`), commit, нов repo в GitHub, `git push` |
| 3 | Vercel → Import Git → избор на repo → задаване на env vars → Deploy |
| 4 | Отваряне на URL и проверка |
| 5 | По избор: свой домейн в Settings → Domains |

Ако на някоя стъпка получите грешка, проверете дали имената на променливите са точно `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` (с префикс `VITE_`), защото само те се подават към клиента при build.
