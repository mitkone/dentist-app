import { XCircle, CheckCircle2 } from 'lucide-react'

const problems = [
  'Excel таблици, в които губите часове',
  'Двойно записани пациенти и объркани часове',
  'Рецепционистката не знае кой лекар е свободен',
  'Не знаете кой пациент не е дошъл миналата седмица',
  'Нямате история на лечението на ръка',
]

const solutions = [
  'Визуален график с drag-and-drop за секунди',
  'Автоматична проверка за конфликти на часове',
  'Графиците на всички лекари на един екран',
  'Пълна история и статуси на всеки пациент',
  'Досие на пациента — достъпно с едно кликване',
]

export default function ValueProposition() {
  return (
    <section className="section-padding bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-medical-600 bg-medical-50 rounded-full mb-4">
            Защо DentPro
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Познато ли ви е това?
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Повечето зъболекари губят между 5 и 10 часа седмично в административна работа,
            която може да се автоматизира.
          </p>
        </div>

        {/* Before / After */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Before */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="font-semibold text-slate-700 text-lg">Преди DentPro</h3>
            </div>
            <ul className="space-y-4">
              {problems.map(p => (
                <li key={p} className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600 leading-snug">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="rounded-2xl border border-medical-200 bg-medical-50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-medical-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-medical-600" />
              </div>
              <h3 className="font-semibold text-slate-700 text-lg">След DentPro</h3>
            </div>
            <ul className="space-y-4">
              {solutions.map(s => (
                <li key={s} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-medical-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700 leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <blockquote className="text-xl text-slate-700 font-medium italic leading-relaxed">
            "Не продаваме софтуер — продаваме ти{' '}
            <span className="text-medical-600 not-italic font-semibold">повече свободно време</span>{' '}
            и{' '}
            <span className="text-medical-600 not-italic font-semibold">по-доволни пациенти</span>."
          </blockquote>
        </div>
      </div>
    </section>
  )
}
