import DemoVideo from './DemoVideo.jsx'

/**
 * Опционална секция с видео (светъл фон). Основното демо е в Hero.
 */
export default function VideoSection() {
  return (
    <section className="section-padding bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-medical-600 bg-medical-100 rounded-full mb-4">
            Виж как работи
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            DentPro накратко
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Кратко демо — график, екип и пациенти в един изглед.
          </p>
        </div>

        <DemoVideo variant="section" />

        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { emoji: '📅', label: 'Запазване на час за секунди' },
            { emoji: '👥', label: 'Всички лекари на един екран' },
            { emoji: '🔍', label: 'Намерете пациент веднага' },
          ].map(({ emoji, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium"
            >
              <span className="text-base">{emoji}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
