import { Stethoscope, ExternalLink } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
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
              Направен от зъболекар, за зъболекари.
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

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">
              Продукт
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Функции', href: '#features' },
                { label: 'Демо', href: '#demo' },
                { label: 'Ценообразуване', href: '#pricing' },
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

          {/* Contact */}
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
