import { ArrowRight, CheckCircle2, Monitor } from 'lucide-react'
import DemoVideo from './DemoVideo.jsx'
import HeroRegisterForm from './HeroRegisterForm.jsx'

const trustPoints = [
  'Пълен достъп по време на бета периода',
  'Готовност за под 5 минути',
  'Работи на телефон и компютър',
]

export default function Hero({ onDemoClick }) {
  return (
    <section className="relative flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-medical-900 overflow-hidden pt-16 pb-16 sm:pb-20">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-medical-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Бета достъп — напълно безплатно
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight mb-5">
            Дигитализирайте графика на клиниката си за 0 лв.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto mb-8">
            Помагаме на българските зъболекари да премахнат хартията. Вземете пълен достъп до платформата
            напълно безплатно срещу вашата обратна връзка.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#register"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-medical-500 hover:bg-medical-400 text-white font-semibold rounded-xl shadow-lg shadow-medical-500/25 transition-all duration-200 text-sm sm:text-base"
            >
              Вземи безплатен достъп сега
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              type="button"
              onClick={onDemoClick}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/8 hover:bg-white/12 border border-white/15 hover:border-white/25 text-white font-medium rounded-xl transition-all duration-200 text-sm sm:text-base"
            >
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <Monitor className="w-3.5 h-3.5 text-white" />
              </div>
              Пробвай демото на живо
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start max-w-5xl mx-auto mb-8">
          <div id="video" className="min-w-0">
            <DemoVideo variant="hero" label="Вижте как платформата работи за 30 секунди." />
          </div>
          <div className="min-w-0 lg:sticky lg:top-24">
            <HeroRegisterForm />
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-8">
          <div className="rounded-2xl border border-medical-400/25 bg-gradient-to-br from-medical-500/15 to-emerald-900/20 px-5 sm:px-8 py-5 sm:py-6 text-center shadow-lg shadow-medical-900/20">
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
              <span className="inline-flex items-center justify-center rounded-lg bg-white/10 text-white font-bold text-xl sm:text-2xl tabular-nums px-3 py-1 mr-2">
                15
              </span>
              лекари вече работят с нас всеки ден — платформата е изградена около реалната им практика.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6">
          {trustPoints.map((point) => (
            <div key={point} className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-medical-400 shrink-0" />
              {point}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
