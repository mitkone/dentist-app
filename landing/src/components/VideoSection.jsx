import { useState, useEffect, useCallback } from 'react'
import { Play, X } from 'lucide-react'

const VIDEO_URL = 'https://youtu.be/9xmKreRMnhg'

export default function VideoSection() {
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close])

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

        {/* Thumbnail */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative w-full rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-2xl shadow-slate-900/30 group cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-medical-400/50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-medical-900/60 via-slate-900/50 to-slate-900/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center mb-6 group-hover:bg-medical-500/40 group-hover:border-medical-400 group-hover:scale-110 transition-all duration-300">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
            </div>
            <p className="text-white font-semibold text-lg sm:text-xl mb-2">
              Кратко видео демо
            </p>
            <p className="text-slate-300 text-sm">Вижте DentPro в действие</p>
          </div>
        </button>

        {/* Modal */}
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
              onClick={close}
            />

            {/* Content */}
            <div className="relative w-full max-w-4xl animate-[scaleIn_250ms_ease-out]">
              <button
                type="button"
                onClick={close}
                className="absolute -top-12 right-0 sm:-top-4 sm:-right-12 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>

              {VIDEO_URL ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl">
                  <iframe
                    src={VIDEO_URL}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="DentPro демо видео"
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-900 aspect-video flex flex-col items-center justify-center text-center px-6 sm:px-12 shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-medical-500/20 flex items-center justify-center mb-6">
                    <Play className="w-7 h-7 text-medical-400 fill-medical-400 ml-0.5" />
                  </div>
                  <p className="text-white font-semibold text-lg sm:text-xl mb-2">
                    Видеото ще бъде налично скоро
                  </p>
                  <p className="text-slate-400 text-sm sm:text-base mb-6 max-w-md">
                    Разгледайте демото на живо!
                  </p>
                  <a
                    href="#demo"
                    onClick={close}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-medical-500 hover:bg-medical-600 text-white text-sm font-semibold rounded-full transition-colors"
                  >
                    Към демото
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teaser cards */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { emoji: '📅', label: 'Запазване на час за 3 клика' },
            { emoji: '👥', label: 'Всички лекари на един екран' },
            { emoji: '🔍', label: 'Намерете пациент за секунди' },
          ].map(({ emoji, label }) => (
            <div
              key={label}
              className="flex items-center justify-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium"
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
