import { Monitor, ArrowRight } from 'lucide-react'

const APP_REGISTER_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/register`
  : 'https://dentpro.dimitargrozdev.com/register'

export default function LivePreview({ onDemoClick }) {
  return (
    <section className="relative bg-white py-16 sm:py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Интерактивно демо
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Разгледайте системата без регистрация
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Отворете демо режима и вижте как изглежда графикът, пациентската база
            и вътрешният чат — с примерни данни.
          </p>
        </div>

        {/* Clickable preview card */}
        <div className="max-w-3xl mx-auto">
          <button
            onClick={onDemoClick}
            className="group w-full relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-medical-400 transition-all duration-300 hover:shadow-xl hover:shadow-medical-100/50 text-left"
          >
            {/* Mock browser chrome */}
            <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-md px-3 py-0.5 text-xs text-slate-400 font-medium border border-slate-200">
                  demo.dentpro.bg
                </div>
              </div>
            </div>

            {/* Mini calendar preview */}
            <div className="bg-white p-0 relative">
              <MiniCalendar />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg text-medical-600 font-semibold text-sm">
                  <Monitor className="w-4 h-4" />
                  Отвори демо на живо
                </div>
              </div>
            </div>
          </button>

          {/* Below the preview: two actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={onDemoClick}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
            >
              <Monitor className="w-4 h-4" />
              Пробвай демото на живо
            </button>
            <a
              href={APP_REGISTER_URL}
              className="flex items-center gap-2 px-6 py-3 bg-medical-500 hover:bg-medical-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
            >
              Започни 21-дневен безплатен период
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniCalendar() {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00']
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
    { doctor: 0, hour: 4, duration: 0.8, patient: 'Надя Стефанова', type: 'Обтурация' },
    { doctor: 1, hour: 0.5, duration: 1, patient: 'Анна Петкова', type: 'Почистване' },
    { doctor: 1, hour: 2, duration: 2, patient: 'Георги Николов', type: 'Хирургия' },
    { doctor: 2, hour: 0, duration: 2, patient: 'Елена Стоева', type: 'Протезиране' },
    { doctor: 2, hour: 3, duration: 1, patient: 'Стефан Вълев', type: 'Екстракция' },
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
