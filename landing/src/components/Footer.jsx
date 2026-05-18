import { Stethoscope, ExternalLink, ArrowRight } from 'lucide-react'

const APP_REGISTER_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/register`
  : 'https://dentpro.dimitargrozdev.com/register'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 text-slate-400">
      {/* Final CTA */}
      <div className="border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-snug">
            Готови ли сте да изхвърлите хартиения бележник?
          </h2>
          <a
            href="#register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-medical-500 hover:bg-medical-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-medical-500/20"
          >
            Регистрирай се безплатно
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="mt-4 text-xs text-slate-500">
            Ограничено до първите 100 клиники · вече 15 лекари в бета програмата
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-medical-600 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">
                Dent<span className="text-medical-400">Pro</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Модерен софтуер за управление на зъболекарски кабинет.
              Направен с обратната връзка на практикуващи зъболекари.
            </p>
            <div className="mt-4">
              <a
                href="https://www.dimitargrozdev.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-medical-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                dimitargrozdev.com
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Продукт
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Функции', href: '#features' },
                { label: 'Демо', href: '#demo' },
                { label: 'Безплатен Достъп', href: '#access' },
                { label: 'Въпроси', href: '#faq' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="text-sm hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Контакт
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:contact@dimitargrozdev.com"
                  className="hover:text-white transition-colors"
                >
                  contact@dimitargrozdev.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.dimitargrozdev.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Блог
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {year} DentPro. Всички права запазени.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Поверителност</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Условия</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
