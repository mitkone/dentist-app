import { ArrowRight, Play, CheckCircle2, Clock, Users, Calendar } from 'lucide-react'

const stats = [
  { icon: Clock, label: 'Спестени часове административна работа седмично', value: '15+' },
  { icon: Users, label: 'Увеличете капацитета на пациентите си', value: '2×' },
  { icon: Calendar, label: 'Минути за първоначална настройка', value: '10' },
]

const trustPoints = [
  'Без регистрация за демото',
  'Готово за работа за 10 минути',
  'Работи на телефон и компютър',
]

export default function Hero({ onDemoClick }) {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-medical-900 overflow-hidden pt-16">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-medical-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-500/15 border border-medical-500/25 text-medical-300 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-medical-400 animate-pulse" />
            Специализиран за България — работи на български
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Повече{' '}
            <span className="relative">
              <span className="text-gradient bg-gradient-to-r from-medical-400 to-emerald-300 bg-clip-text text-transparent">
                време за пациентите,
              </span>
            </span>
            <br />
            по-малко хаос с графика
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            DentPro организира часовете, пациентите и екипа ти в един прост интерфейс.
            Без Excel таблици, без тефтери, без объркани рецепционистки.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={onDemoClick}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-medical-500 hover:bg-medical-400 text-white font-semibold rounded-xl shadow-lg shadow-medical-500/25 hover:shadow-medical-400/30 transition-all duration-200 text-base"
            >
              Разгледайте Демото
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#video"
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-white/8 hover:bg-white/12 border border-white/15 hover:border-white/25 text-white font-medium rounded-xl transition-all duration-200 text-base"
            >
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
              </div>
              Кратко видео демо
            </a>
          </div>

          {/* Trust points */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-16">
            {trustPoints.map(point => (
              <div key={point} className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-medical-400 shrink-0" />
                {point}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center text-center px-4 py-4 rounded-xl bg-white/5 border border-white/10">
                <Icon className="w-5 h-5 text-medical-400 mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{value}</div>
                <div className="text-xs text-slate-400 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* App preview mockup */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/40">
            {/* Window chrome */}
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400">
                  dentpro.app/calendar
                </div>
              </div>
            </div>

            {/* Mock UI */}
            <div className="bg-slate-50 p-0">
              <MockCalendarPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MockCalendarPreview() {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00']
  const doctors = ['Д-р Иванова', 'Д-р Петров', 'Д-р Стоянова']
  const doctorColors = [
    'bg-emerald-100 border-emerald-300 text-emerald-800',
    'bg-blue-100 border-blue-300 text-blue-800',
    'bg-violet-100 border-violet-300 text-violet-800',
  ]

  const appointments = [
    { doctor: 0, hour: 0, duration: 1, patient: 'Мария Тодорова', type: 'Преглед' },
    { doctor: 0, hour: 2, duration: 2, patient: 'Иван Димитров', type: 'Лечение' },
    { doctor: 1, hour: 1, duration: 1, patient: 'Анна Петкова', type: 'Почистване' },
    { doctor: 1, hour: 3, duration: 1, patient: 'Георги Николов', type: 'Преглед' },
    { doctor: 2, hour: 0, duration: 2, patient: 'Елена Стоева', type: 'Протеза' },
    { doctor: 2, hour: 4, duration: 1, patient: 'Стефан Вълев', type: 'Лечение' },
  ]

  return (
    <div className="flex h-64 overflow-hidden select-none">
      {/* Time column */}
      <div className="w-14 shrink-0 bg-white border-r border-slate-200">
        <div className="h-8 border-b border-slate-200 bg-slate-50" />
        {hours.map(h => (
          <div key={h} className="h-[32px] border-b border-slate-100 flex items-center justify-end pr-2">
            <span className="text-xs text-slate-400">{h}</span>
          </div>
        ))}
      </div>

      {/* Doctor columns */}
      {doctors.map((doc, dIdx) => (
        <div key={doc} className="flex-1 border-r border-slate-200 last:border-r-0 relative">
          <div className="h-8 border-b border-slate-200 bg-slate-50 flex items-center justify-center px-1">
            <span className="text-xs font-medium text-slate-600 truncate">{doc}</span>
          </div>
          <div className="relative">
            {hours.map((_, hIdx) => (
              <div key={hIdx} className="h-[32px] border-b border-slate-100" />
            ))}
            {appointments
              .filter(a => a.doctor === dIdx)
              .map((appt, i) => (
                <div
                  key={i}
                  className={`absolute left-0.5 right-0.5 rounded-md border px-1 py-0.5 overflow-hidden ${doctorColors[dIdx]}`}
                  style={{
                    top: `${appt.hour * 32}px`,
                    height: `${appt.duration * 32 - 2}px`,
                  }}
                >
                  <div className="text-[10px] font-semibold leading-tight truncate">{appt.patient}</div>
                  <div className="text-[9px] opacity-70 truncate">{appt.type}</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
