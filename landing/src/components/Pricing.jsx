import { useState } from 'react'
import { CheckCircle2, Zap, Building2, Star, Info, Loader2 } from 'lucide-react'

const STRIPE_PRICES = {
  'Стартер': import.meta.env.VITE_STRIPE_PRICE_STARTER,
  'Про':     import.meta.env.VITE_STRIPE_PRICE_PRO,
}
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

async function redirectToCheckout(planName) {
  const priceId = STRIPE_PRICES[planName]
  if (!priceId || !SUPABASE_URL) {
    alert('Stripe не е конфигуриран. Добавете VITE_STRIPE_PRICE_* и VITE_SUPABASE_URL в .env')
    return
  }
  const email = prompt('Вашият имейл адрес:')
  if (!email) return

  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, email, clinicName: '' }),
  })
  const { url, error } = await res.json()
  if (error) { alert(`Грешка: ${error}`); return }
  window.location.href = url
}

const plans = [
  {
    name: 'Стартер',
    icon: Zap,
    setupFee: '150',
    price: '49',
    period: '/месец',
    description: 'Перфектен за малки кабинети с 1-2 лекари.',
    color: 'border-slate-200',
    headerBg: 'bg-slate-50',
    buttonStyle: 'border-2 border-medical-500 text-medical-600 hover:bg-medical-50',
    badge: null,
    features: [
      'До 2 лекари',
      'Неограничени пациенти',
      'Дневен и седмичен график',
      'Пациентска база',
      'Вътрешен чат',
      'Email поддръжка',
    ],
    cta: 'Започнете сега',
  },
  {
    name: 'Про',
    icon: Star,
    setupFee: '150',
    price: '89',
    period: '/месец',
    description: 'За клиники с екип и нужда от пълен контрол.',
    color: 'border-medical-400 shadow-xl shadow-medical-100',
    headerBg: 'bg-gradient-to-br from-medical-600 to-medical-700',
    buttonStyle: 'bg-medical-500 hover:bg-medical-400 text-white shadow-md shadow-medical-200',
    badge: 'Най-популярен',
    features: [
      'До 8 лекари',
      'Неограничени пациенти',
      'Всичко от Стартер',
      'Управление на отпуски',
      'Роли и права (3 нива)',
      'Известия за промени',
      'Лог на активността',
      'Приоритетна поддръжка',
    ],
    cta: 'Изберете Про',
  },
  {
    name: 'Клиника',
    icon: Building2,
    setupFee: null,
    price: 'По запитване',
    period: '',
    description: 'За мрежи от клиники с персонализирани нужди.',
    color: 'border-slate-200',
    headerBg: 'bg-slate-50',
    buttonStyle: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50',
    badge: null,
    features: [
      'Неограничен брой лекари',
      'Множество локации',
      'Персонализирани функции',
      'Onboarding и обучение',
      'Dedicated поддръжка',
      'SLA гаранция',
    ],
    cta: 'Свържете се с нас',
  },
]

export default function Pricing({ onDemoClick }) {
  const [loadingPlan, setLoadingPlan] = useState(null)

  async function handleBuy(planName) {
    setLoadingPlan(planName)
    try {
      await redirectToCheckout(planName)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <section id="pricing" className="section-padding bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-medical-600 bg-medical-100 rounded-full mb-4">
            Ценообразуване
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Прост и прозрачен избор
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Без скрити такси. Без дългосрочни ангажименти. Отменете по всяко време.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map(({ name, icon: Icon, setupFee, price, period, description, color, headerBg, buttonStyle, badge, features, cta }) => (
            <div
              key={name}
              className={`relative rounded-2xl border-2 bg-white overflow-hidden flex flex-col ${color}`}
            >
              {badge && (
                <div className="absolute top-4 right-4 px-2.5 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wide">
                  {badge}
                </div>
              )}

              {/* Header */}
              <div className={`p-6 ${headerBg} border-b border-slate-100`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${badge ? 'bg-white/20' : 'bg-medical-100'}`}>
                  <Icon className={`w-5 h-5 ${badge ? 'text-white' : 'text-medical-600'}`} />
                </div>
                <h3 className={`font-bold text-lg mb-0.5 ${badge ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
                <p className={`text-sm ${badge ? 'text-medical-100' : 'text-slate-500'}`}>{description}</p>

                {/* Price display */}
                <div className="mt-4 space-y-1.5">
                  {setupFee && (
                    <div className={`text-xs ${badge ? 'text-medical-200' : 'text-slate-400'}`}>
                      Еднократна такса внедряване:{' '}
                      <span className={`font-semibold ${badge ? 'text-white' : 'text-slate-600'}`}>
                        {setupFee}€
                      </span>
                    </div>
                  )}
                  <div className="flex items-end gap-1">
                    {period ? (
                      <>
                        <span className={`text-3xl font-bold ${badge ? 'text-white' : 'text-slate-900'}`}>
                          {price}€
                        </span>
                        <span className={`text-sm mb-1 ${badge ? 'text-medical-200' : 'text-slate-400'}`}>
                          {period}
                        </span>
                      </>
                    ) : (
                      <span className={`text-2xl font-bold ${badge ? 'text-white' : 'text-slate-900'}`}>
                        {price}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 flex-1 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-medical-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {name === 'Стартер' || name === 'Про' ? (
                  <button
                    onClick={() => handleBuy(name)}
                    disabled={loadingPlan === name}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 ${buttonStyle}`}
                  >
                    {loadingPlan === name && <Loader2 className="w-4 h-4 animate-spin" />}
                    {cta}
                  </button>
                ) : (
                  <a
                    href="mailto:contact@dimitargrozdev.com"
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center ${buttonStyle}`}
                  >
                    {cta}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Setup fee explanation */}
        <div className="mt-8 flex items-start gap-3 max-w-2xl mx-auto p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700 leading-relaxed">
            <span className="font-semibold">Такса внедряване (150€, еднократно):</span>{' '}
            Включва настройка на акаунта, импорт на съществуващи данни, обучение на екипа (1 час онлайн сесия) и персонализиране на работния график.
          </p>
        </div>

        {/* Stripe payment flow */}
        <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl max-w-2xl mx-auto">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-medical-100 flex items-center justify-center text-medical-600 text-xs font-bold">₿</span>
            Как работи плащането
          </h3>
          <ol className="space-y-3">
            {[
              { step: '1', text: 'Изберете план и кликнете "Започнете сега"' },
              { step: '2', text: 'Пренасочване към Stripe — плащане с карта (Visa/Mastercard)' },
              { step: '3', text: 'Автоматичен имейл с линк за активация на профила (до 5 минути)' },
              { step: '4', text: 'Влизате в системата и конфигурирате кабинета си' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                  {step}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>

        {/* Bottom note */}
        <p className="text-center mt-8 text-sm text-slate-400">
          Всички планове включват 14-дневен безплатен пробен период. Не се изисква кредитна карта.
        </p>
      </div>
    </section>
  )
}
