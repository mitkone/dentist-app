import {
  Calendar,
  Users,
  MessageSquare,
  Shield,
  BarChart3,
  Smartphone,
  Clock,
  Search,
  Bell,
  UserCheck,
  Receipt,
} from 'lucide-react'

const mainFeatures = [
  {
    icon: Calendar,
    title: 'Визуален График',
    description:
      'Дневен и седмичен изглед с интуитивен интерфейс. Вижте всички лекари на един екран. Запишете час с едно кликване.',
    color: 'text-medical-500',
    bg: 'bg-medical-50',
    border: 'border-medical-100',
  },
  {
    icon: Users,
    title: 'Пациентска База',
    description:
      'Пълно досие на всеки пациент — история на прегледите, бележки, контакти и статус. Намерете всеки пациент за секунди.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: UserCheck,
    title: 'Управление на Лекари',
    description:
      'Отпуски, специалности, цветова маркировка. Всеки лекар вижда само своя график — пълна поверителност.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: MessageSquare,
    title: 'Вътрешен Чат',
    description:
      'Комуникирайте с екипа директно в приложението. Без Viber групи, без объркани съобщения.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: Shield,
    title: 'Роли и Права',
    description:
      'Администратор, рецепционист, лекар — всеки вижда само това, което му е нужно. Пълна сигурност.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
  {
    icon: Receipt,
    title: 'Автоматични Разписки по Имейл',
    description:
      'След всяко плащане пациентът получава разписка автоматично. Без ръчно принтиране, без загубени документи.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
]

const miniFeatures = [
  { icon: Search, label: 'Бързо търсене на пациенти' },
  { icon: Clock, label: 'Свободни слотове с един клик' },
  { icon: Smartphone, label: 'Работи на телефон' },
  { icon: BarChart3, label: 'Лог на активността' },
]

export default function Features() {
  return (
    <section id="features" className="section-padding bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-medical-600 bg-medical-50 rounded-full mb-4">
            Всичко включено
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Функции, направени за зъболекарски кабинет
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Не е универсален инструмент. Направен е специално за денталната практика
            с функции, от които наистина се нуждаете.
          </p>
        </div>

        {/* Main feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {mainFeatures.map(({ icon: Icon, title, description, color, bg, border }) => (
            <div
              key={title}
              className={`rounded-2xl p-6 bg-white border ${border} hover:shadow-md transition-shadow duration-200`}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 text-base">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Mini features */}
        <div className="flex flex-wrap justify-center gap-3">
          {miniFeatures.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm"
            >
              <Icon className="w-4 h-4 text-medical-500" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
