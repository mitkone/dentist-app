import { MessageCircle, ArrowRight } from 'lucide-react'

export default function WhyFree() {
  return (
    <section id="access" className="section-padding bg-white scroll-mt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-medical-600 bg-medical-50 rounded-full mb-4">
          Безплатен бета достъп
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5 flex items-center justify-center gap-2 flex-wrap">
          <MessageCircle className="w-7 h-7 text-medical-500 shrink-0" />
          Защо е безплатно?
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          Защото вярваме, че най-добрият софтуер се прави заедно с професионалистите. Търсим още{' '}
          <span className="font-semibold text-slate-900">85 клиники</span>, които да тестват системата и да ни
          помогнат да я направим №1 в България.
        </p>
        <p className="text-sm text-slate-500 mb-8 max-w-xl mx-auto">
          Създателят на DentPro работи директно с практикуващи зъболекари — вашата обратна връзка оформя
          всеки ъпдейт, преди да стане „официален“ продукт.
        </p>
        <a
          href="#register"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-medical-500 hover:bg-medical-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-medical-500/20"
        >
          Вземи безплатен достъп сега
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  )
}
