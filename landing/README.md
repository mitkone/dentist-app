# DentPro Landing Page

Лендинг страница за DentPro — достъпна на `www.dimitargrozdev.com/dentist-tool`.

## Технологии
- **Vite + React 18**
- **Tailwind CSS 3**
- **Lucide React** (икони)

## Разработка

```bash
cd landing
npm install
npm run dev
```

Отваря се на `http://localhost:5173/dentist-tool/`

## Продукционен Build

```bash
npm run build
```

Генерира папка `dist/` — качете нейното съдържание в `/dentist-tool/` директорията на вашия хостинг.

## Деплой на съществуващ домейн

### Option A — Static Hosting (препоръчително)
1. `npm run build` → копирайте `dist/` в `/public_html/dentist-tool/` на вашия хостинг
2. Достъпно на `www.dimitargrozdev.com/dentist-tool`

### Option B — Vercel/Netlify (отделен subdomain)
1. Деплойте landing/ директорията като отделен проект
2. Настройте custom domain: `dentpro.dimitargrozdev.com`

### Option C — GitHub Pages
1. Добавете `gh-pages` пакет: `npm i -D gh-pages`
2. `npm run build && npx gh-pages -d dist`

## Структура на компонентите

```
src/
├── App.jsx                    # Главен компонент с state за демото
├── index.css                  # Tailwind + глобални стилове
├── main.jsx                   # React root
└── components/
    ├── Navbar.jsx             # Навигационна лента (sticky, responsive)
    ├── Hero.jsx               # Hero секция с mock calendar preview
    ├── ValueProposition.jsx   # Before/After сравнение
    ├── Features.jsx           # Функции grid
    ├── VideoSection.jsx       # Video placeholder + скрипт
    ├── Pricing.jsx            # 3 плана за ценообразуване
    ├── FAQ.jsx                # Accordion FAQ
    ├── InteractiveDemo.jsx    # Пълно read-only демо (модален прозорец)
    └── Footer.jsx             # Footer с линкове
```

## Добавяне на реалното видео

В `VideoSection.jsx` намерете placeholder и заменете с:

```jsx
<iframe
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  className="absolute inset-0 w-full h-full"
  allowFullScreen
/>
```

## Персонализация

- **Имейл контакт:** Търсете `contact@dimitargrozdev.com` и заменете с вашия
- **Цени:** Редактирайте в `Pricing.jsx`
- **FAQ:** Редактирайте масива `faqs` в `FAQ.jsx`
- **Цветове:** Tailwind класовете `medical-*` са дефинирани в `tailwind.config.js`
