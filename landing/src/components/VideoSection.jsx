import { Play } from 'lucide-react'

export default function VideoSection() {
  return (
    <section id="video" className="section-padding bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-medical-600 bg-medical-50 rounded-full mb-4">
            Виж как работи
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Вижте как работи системата за секунди
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Кратко демо, което показва как DentPro спестява часове административна работа всеки ден.
          </p>
        </div>

        {/* Video player */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-2xl shadow-slate-900/30 group cursor-pointer">
          {/* Replace the content below with a real <iframe> after recording your video */}
          {/* Example: <iframe src="https://www.youtube.com/embed/YOUR_ID" className="absolute inset-0 w-full h-full" allowFullScreen /> */}

          <div className="absolute inset-0 bg-gradient-to-br from-medical-900/70 to-slate-900/85" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center mb-6 group-hover:bg-medical-500/40 group-hover:border-medical-400 transition-all duration-300">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
            <p className="text-white font-semibold text-xl mb-2">Кратко видео демо</p>
            <p className="text-slate-300 text-sm">
              Вижте DentPro в действие
            </p>
          </div>

          <div className="absolute top-4 left-4 px-3 py-1.5 bg-amber-400/90 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wide">
            Скоро
          </div>
        </div>

        {/* Teaser below video */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { emoji: '📅', label: 'Запазване на час за 3 клика' },
            { emoji: '👥', label: 'Всички лекари на един екран' },
            { emoji: '🔍', label: 'Намерете пациент за секунди' },
          ].map(({ emoji, label }) => (
            <div key={label} className="flex items-center justify-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">
              <span className="text-base">{emoji}</span>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
