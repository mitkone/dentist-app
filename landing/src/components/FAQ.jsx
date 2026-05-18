import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Трябва ли ми техническо знание, за да стартирам?',
    a: 'Не. DentPro е уеб приложение — отваряте го в браузъра, влизате с имейл и парола и сте готови. Няма инсталация, няма IT специалист. Настройката отнема под 10 минути.',
  },
  {
    q: 'Мога ли да пробвам без регистрация?',
    a: 'Да! Кликнете "Разгледайте Демото" на тази страница и ще видите напълно функционална версия на приложението с примерни данни. Не се изисква имейл адрес.',
  },
  {
    q: 'Данните на пациентите ми сигурни ли са?',
    a: 'Да. Данните се съхраняват криптирани в Supabase (PostgreSQL), с row-level security — всяка клиника вижда само своите данни. Отговаря на европейските изисквания за поверителност (GDPR).',
  },
  {
    q: 'Колко лекари мога да добавя?',
    a: 'По време на бета периода можете да добавите екипа си според нуждите на клиниката. Ако имате специфични изисквания, пишете ни — ще ги вземем предвид при развитието на продукта.',
  },
  {
    q: 'Работи ли на телефон?',
    a: 'Да, интерфейсът е напълно responsive. Рецепционистите могат да работят на таблет или телефон, а лекарите да проверяват графика си от всяко устройство.',
  },
  {
    q: 'Колко дълго е безплатният бета достъп?',
    a: 'По време на бета фазата достъпът е безплатен за избраните клиники. Ще ви уведомим навреме, преди да въведем платени планове — без изненади.',
  },
  {
    q: 'Предлагате ли обучение и поддръжка?',
    a: 'Да. Бета участниците получават директна поддръжка от създателя на платформата — имейл и обратна връзка, която реално влиза в продукта.',
  },
  {
    q: 'Мога ли да мигрирам данните си от стара система?',
    a: 'Ако имате данни в Excel или CSV формат, можем да ги импортираме за вас. Свържете се с нас преди да стартирате и ще организираме гладка миграция.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium text-slate-800 text-sm leading-snug">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 bg-white">
          <p className="text-sm text-slate-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="section-padding bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-medical-600 bg-medical-50 rounded-full mb-4">
            Въпроси и Отговори
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Имате въпроси? Ние имаме отговори.
          </h2>
          <p className="text-slate-500">
            Не намирате отговора? Пишете ни директно.
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <FAQItem key={q} q={q} a={a} />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-slate-600 mb-4">
            Имате специфичен въпрос за вашата клиника?
          </p>
          <a
            href="mailto:contact@dimitargrozdev.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-medical-500 hover:bg-medical-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            Пишете ни
          </a>
        </div>
      </div>
    </section>
  )
}
