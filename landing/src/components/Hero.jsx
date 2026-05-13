import { ArrowRight, Play, CheckCircle2, Clock, Users, Calendar, Monitor } from 'lucide-react'

const APP_REGISTER_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/register`
  : 'https://dentpro.dimitargrozdev.com/register'

const stats = [
  { icon: Clock, label: 'Спестени часове административна работа седмично', value: '15+' },
  { icon: Users, label: 'Увеличете капацитета на пациентите си', value: '2×' },
  { icon: Calendar, label: 'Минути за първоначална настройка', value: '10' },
]

const trustPoints = [
  'Без карта за пробния период',
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
            Дигиталното{' '}
            <span className="text-gradient bg-gradient-to-r from-medical-400 to-emerald-300 bg-clip-text text-transparent">
              бъдеще
            </span>
            {' '}на вашата клиника
            <br />
            започва тук.
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            Графици, пациенти и екип — всичко в един минималистичен интерфейс,
            създаден специално за зъболекари.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a
              href={APP_REGISTER_URL}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-medical-500 hover:bg-medical-400 text-white font-semibold rounded-xl shadow-lg shadow-medical-500/25 hover:shadow-medical-400/30 transition-all duration-200 text-base"
            >
              Започни 21-дневен безплатен период
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={onDemoClick}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-white/8 hover:bg-white/12 border border-white/15 hover:border-white/25 text-white font-medium rounded-xl transition-all duration-200 text-base"
            >
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <Monitor className="w-3.5 h-3.5 text-white" />
              </div>
              Пробвай демото на живо
            </button>
          </div>
          <div className="flex items-center justify-center mb-12">
            <a
              href="#video"
              className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Или гледайте видео демо
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

        </div>

        {/* App preview mockup — premium browser window */}
        <div className="mt-12 max-w-[1000px] mx-auto relative">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/5">
            {/* Window chrome */}
            <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-slate-700/80 rounded-md px-4 py-1 text-xs text-slate-400 font-medium tracking-wide">
                  app.dentpro.bg/calendar
                </div>
              </div>
            </div>

            {/* Mock UI — full calendar preview */}
            <div className="bg-slate-50 p-0">
              <MockCalendarPreview />
            </div>
          </div>

          {/* Glow under mockup */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-medical-500/20 blur-3xl rounded-full pointer-events-none" />
        </div>

        {/* Stats — below mockup */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center text-center px-4 py-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Icon className="w-5 h-5 text-medical-400 mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-xs text-slate-400 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MockCalendarPreview() {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
  const doctors = [
    { name: 'Д-р Иванова', color: '#14b8a6' },
    { name: 'Д-р Петров', color: '#3b82f6' },
    { name: 'Д-р Стоянова', color: '#a855f7' },
  ]
  const colorMap = [
    'bg-emerald-100 border-emerald-300 text-emerald-800',
    'bg-blue-100 border-blue-300 text-blue-800',
    'bg-violet-100 border-violet-300 text-violet-800',
  ]
  const appointments = [
    { doctor: 0, hour: 0, duration: 1, patient: 'Мария Тодорова', type: 'Преглед' },
    { doctor: 0, hour: 1.5, duration: 1.5, patient: 'Иван Димитров', type: 'Ендодонтия' },
    { doctor: 0, hour: 4, duration: 1, patient: 'Петър Колев', type: 'Контролен' },
    { doctor: 0, hour: 6, duration: 1.5, patient: 'Надя Стефанова', type: 'Обтурация' },
    { doctor: 1, hour: 0.5, duration: 1, patient: 'Анна Петкова', type: 'Почистване' },
    { doctor: 1, hour: 2, duration: 2, patient: 'Георги Николов', type: 'Хирургия' },
    { doctor: 1, hour: 5, duration: 1, patient: 'Деян Маринов', type: 'Преглед' },
    { doctor: 2, hour: 0, duration: 2, patient: 'Елена Стоева', type: 'Протезиране' },
    { doctor: 2, hour: 3, duration: 1, patient: 'Стефан Вълев', type: 'Екстракция' },
    { doctor: 2, hour: 5.5, duration: 1.5, patient: 'Калина Борисова', type: 'Ортодонтия' },
  ]
  const ROW = 28

  return (
    <div className="flex overflow-hidden select-none" style={{ height: hours.length * ROW + 36 }}>
      <div className="w-14 shrink-0 bg-white border-r border-slate-200">
        <div className="h-9 border-b border-slate-200 bg-slate-50" />
        {hours.map(h => (
          <div key={h} className="border-b border-slate-100 flex items-center justify-end pr-2" style={{ height: ROW }}>
            <span className="text-[10px] text-slate-400 font-medium">{h}</span>
          </div>
        ))}
      </div>
      {doctors.map((doc, dIdx) => (
        <div key={doc.name} className="flex-1 border-r border-slate-200 last:border-r-0 relative">
          <div className="h-9 border-b border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5 px-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: doc.color }} />
            <span className="text-[11px] font-semibold text-slate-700 truncate">{doc.name}</span>
          </div>
          <div className="relative">
            {hours.map((_, hIdx) => (
              <div key={hIdx} className="border-b border-slate-100" style={{ height: ROW }} />
            ))}
            {appointments
              .filter(a => a.doctor === dIdx)
              .map((appt, i) => (
                <div
                  key={i}
                  className={`absolute left-0.5 right-0.5 rounded border px-1.5 py-0.5 overflow-hidden ${colorMap[dIdx]}`}
                  style={{
                    top: appt.hour * ROW,
                    height: appt.duration * ROW - 2,
                  }}
                >
                  <div className="text-[10px] font-semibold leading-tight truncate">{appt.patient}</div>
                  {appt.duration >= 1 && <div className="text-[9px] opacity-70 truncate">{appt.type}</div>}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
