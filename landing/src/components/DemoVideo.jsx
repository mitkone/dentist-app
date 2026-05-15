import { useState, useEffect, useCallback } from 'react'
import { Play, X } from 'lucide-react'

export const DEMO_VIDEO_EMBED_URL = 'https://www.youtube.com/embed/9xmKreRMnhg'

/**
 * Thumbnail + modal player. `variant`: hero (dark border) | section (light page block).
 */
export default function DemoVideo({
  label,
  variant = 'hero',
}) {
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

  const isHero = variant === 'hero'

  return (
    <div className="w-full">
      {label ? (
        <p className={`text-sm font-medium mb-3 ${isHero ? 'text-slate-200' : 'text-slate-700'}`}>
          {label}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative w-full rounded-2xl overflow-hidden aspect-video shadow-2xl group cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-medical-400/50 ${
          isHero
            ? 'bg-slate-900 border border-white/10 ring-1 ring-white/5'
            : 'bg-slate-900 shadow-slate-900/30'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-medical-900/60 via-slate-900/50 to-slate-900/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)]" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 border-2 border-white/25 flex items-center justify-center mb-4 group-hover:bg-medical-500/40 group-hover:border-medical-400 group-hover:scale-110 transition-all duration-300">
            <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white ml-1" />
          </div>
          <p className="text-white font-semibold text-base sm:text-lg mb-1">Кратко видео демо</p>
          <p className="text-slate-300 text-xs sm:text-sm">Възпроизведете за 60 секунди</p>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
            onClick={close}
          />

          <div className="relative w-full max-w-4xl animate-[scaleIn_250ms_ease-out]">
            <button
              type="button"
              onClick={close}
              className="absolute -top-12 right-0 sm:-top-4 sm:-right-12 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Затвори"
            >
              <X className="w-5 h-5" />
            </button>

            {DEMO_VIDEO_EMBED_URL ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl">
                <iframe
                  src={DEMO_VIDEO_EMBED_URL}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="DentPro демо видео"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
