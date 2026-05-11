import { useState, useEffect } from 'react'
import { Menu, X, Stethoscope } from 'lucide-react'

const navLinks = [
  { label: 'Функции', href: '#features' },
  { label: 'Демо', href: '#demo' },
  { label: 'Ценообразуване', href: '#pricing' },
  { label: 'Въпроси', href: '#faq' },
]

export default function Navbar({ onDemoClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-medical-500 flex items-center justify-center shadow-sm group-hover:bg-medical-600 transition-colors">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-lg tracking-tight transition-colors duration-300 ${
              scrolled ? 'text-slate-900' : 'text-white'
            }`}>
              Dent<span className="text-medical-400">Pro</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  scrolled
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onDemoClick}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                scrolled ? 'text-medical-600 hover:text-medical-700' : 'text-medical-300 hover:text-white'
              }`}
            >
              Пробвайте безплатно
            </button>
            <a
              href="#pricing"
              className="px-4 py-2 text-sm font-semibold bg-medical-500 hover:bg-medical-600 text-white rounded-lg transition-colors shadow-sm"
            >
              Вземете достъп
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Меню"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pb-4">
          <nav className="flex flex-col gap-1 mt-2">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={() => { onDemoClick(); setMobileOpen(false) }}
              className="w-full py-2.5 text-sm font-medium text-medical-600 border border-medical-200 rounded-lg hover:bg-medical-50 transition-colors"
            >
              Пробвайте безплатно
            </button>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 text-sm font-semibold bg-medical-500 hover:bg-medical-600 text-white rounded-lg transition-colors text-center"
            >
              Вземете достъп
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
