import { useState } from 'react'
import {
  X,
  Calendar,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Bell,
  Clock,
  Filter,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  Lock,
  ArrowRight,
} from 'lucide-react'

const APP_REGISTER_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/register`
  : 'https://dentpro.dimitargrozdev.com/register'

/* ─── Mock Data ─────────────────────────────────────────── */

const DOCTORS = [
  { id: 1, name: 'Д-р Иванова', short: 'ДИ', color: 'emerald', spec: 'Обща стоматология' },
  { id: 2, name: 'Д-р Петров', short: 'ДП', color: 'blue', spec: 'Ортодонтия' },
  { id: 3, name: 'Д-р Стоянова', short: 'ДС', color: 'violet', spec: 'Имплантология' },
]

const COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800',
    dot: 'bg-emerald-400', avatar: 'bg-emerald-500',
  },
  blue: {
    bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800',
    dot: 'bg-blue-400', avatar: 'bg-blue-500',
  },
  violet: {
    bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800',
    dot: 'bg-violet-400', avatar: 'bg-violet-500',
  },
}

const APPOINTMENTS = [
  { id: 1, doctor: 1, hour: 8, min: 0, duration: 60, patient: 'Мария Тодорова', type: 'Профилактичен преглед', status: 'confirmed', phone: '0888 123 456' },
  { id: 2, doctor: 1, hour: 9, min: 30, duration: 90, patient: 'Иван Димитров', type: 'Лечение на кариес', status: 'confirmed', phone: '0877 234 567' },
  { id: 3, doctor: 1, hour: 11, min: 30, duration: 60, patient: 'Петър Колев', type: 'Преглед', status: 'pending', phone: '0899 345 678' },
  { id: 4, doctor: 1, hour: 14, min: 0, duration: 30, patient: 'Елена Начева', type: 'Консултация', status: 'confirmed', phone: '0888 456 789' },
  { id: 5, doctor: 2, hour: 8, min: 30, duration: 60, patient: 'Анна Петкова', type: 'Почистване', status: 'confirmed', phone: '0877 567 890' },
  { id: 6, doctor: 2, hour: 10, min: 0, duration: 120, patient: 'Георги Николов', type: 'Ортодонтски апарат', status: 'confirmed', phone: '0899 678 901' },
  { id: 7, doctor: 2, hour: 13, min: 0, duration: 60, patient: 'Надя Василева', type: 'Преглед', status: 'cancelled', phone: '0888 789 012' },
  { id: 8, doctor: 3, hour: 9, min: 0, duration: 120, patient: 'Стефан Вълев', type: 'Имплант консултация', status: 'confirmed', phone: '0877 890 123' },
  { id: 9, doctor: 3, hour: 11, min: 0, duration: 90, patient: 'Камен Тодоров', type: 'Поставяне на имплант', status: 'confirmed', phone: '0899 901 234' },
  { id: 10, doctor: 3, hour: 14, min: 30, duration: 60, patient: 'Весела Иванова', type: 'Контролен преглед', status: 'pending', phone: '0888 012 345' },
]

const PATIENTS = [
  { id: 1, name: 'Мария Тодорова', phone: '0888 123 456', email: 'maria@example.com', lastVisit: '06.05.2026', doctor: 'Д-р Иванова', visits: 8, notes: 'Редовен пациент. Страда от чувствителни зъби.' },
  { id: 2, name: 'Иван Димитров', phone: '0877 234 567', email: 'ivan@example.com', lastVisit: '28.04.2026', doctor: 'Д-р Иванова', visits: 3, notes: 'Нов пациент. Изисква специфична анестезия.' },
  { id: 3, name: 'Анна Петкова', phone: '0877 567 890', email: 'anna@example.com', lastVisit: '01.05.2026', doctor: 'Д-р Петров', visits: 12, notes: 'VIP пациент.' },
  { id: 4, name: 'Георги Николов', phone: '0899 678 901', email: 'georgi@example.com', lastVisit: '30.04.2026', doctor: 'Д-р Петров', visits: 5, notes: '' },
  { id: 5, name: 'Стефан Вълев', phone: '0877 890 123', email: 'stefan@example.com', lastVisit: '05.05.2026', doctor: 'Д-р Стоянова', visits: 2, notes: 'Предстои имплант процедура.' },
]

const MESSAGES = [
  { id: 1, from: 'Д-р Иванова', text: 'Пациентът в 10:00 поиска да смени часа за 10:30.', time: '09:15', unread: true },
  { id: 2, from: 'Рецепция', text: 'Новият пациент Иван Димитров се обади и потвърди часа.', time: '08:45', unread: true },
  { id: 3, from: 'Д-р Петров', text: 'Излизам на обяд в 12:30, а не в 13:00.', time: '08:30', unread: false },
]

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8)

/* ─── Helper components ──────────────────────────────────── */

function ReadOnlyBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700">
      <Lock className="w-3 h-3" />
      Само за четене — Демо режим
    </div>
  )
}

function Avatar({ name, color = 'emerald', size = 'sm' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const c = COLOR_MAP[color] || COLOR_MAP.emerald
  const sz = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs'
  return (
    <div className={`${sz} rounded-full ${c.avatar} flex items-center justify-center font-semibold text-white shrink-0`}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { label: 'Потвърден', cls: 'bg-emerald-100 text-emerald-700' },
    pending: { label: 'Чакащ', cls: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'Отменен', cls: 'bg-rose-100 text-rose-600 line-through' },
  }
  const s = map[status] || map.pending
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  )
}

/* ─── Calendar View ──────────────────────────────────────── */

function CalendarView({ onAppointmentClick }) {
  const [activeDoctors, setActiveDoctors] = useState([1, 2, 3])

  const toggleDoctor = id => {
    setActiveDoctors(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(d => d !== id) : prev) : [...prev, id]
    )
  }

  const visibleDoctors = DOCTORS.filter(d => activeDoctors.includes(d.id))

  return (
    <div className="flex flex-col h-full">
      {/* Doctor filter */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Лекари:
        </span>
        {DOCTORS.map(d => {
          const c = COLOR_MAP[d.color]
          const active = activeDoctors.includes(d.id)
          return (
            <button
              key={d.id}
              onClick={() => toggleDoctor(d.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                active
                  ? `${c.bg} ${c.border} ${c.text}`
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${active ? c.dot : 'bg-slate-300'}`} />
              {d.name}
            </button>
          )
        })}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-w-[500px]">
          {/* Time column */}
          <div className="w-14 shrink-0 border-r border-slate-200 bg-slate-50">
            <div className="h-10 border-b border-slate-200" />
            {HOURS.map(h => (
              <div key={h} className="h-14 border-b border-slate-100 flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-slate-400">{`${h}:00`}</span>
              </div>
            ))}
          </div>

          {/* Doctor columns */}
          {visibleDoctors.map(doc => {
            const c = COLOR_MAP[doc.color]
            const docAppts = APPOINTMENTS.filter(a => a.doctor === doc.id)
            const minutesPerPx = 14 / 60

            return (
              <div key={doc.id} className="flex-1 border-r border-slate-200 last:border-r-0 relative min-w-[120px]">
                <div className="h-10 border-b border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5 px-2">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className="text-xs font-semibold text-slate-700 truncate">{doc.name}</span>
                </div>
                <div className="relative">
                  {HOURS.map(h => (
                    <div key={h} className="h-14 border-b border-slate-100" />
                  ))}
                  {docAppts.map(appt => {
                    const top = ((appt.hour - 8) * 60 + appt.min) * minutesPerPx
                    const height = Math.max(appt.duration * minutesPerPx - 2, 20)
                    return (
                      <button
                        key={appt.id}
                        onClick={() => onAppointmentClick(appt)}
                        className={`absolute left-0.5 right-0.5 rounded-lg border px-2 py-1 overflow-hidden text-left hover:shadow-md hover:z-10 transition-all ${c.bg} ${c.border} ${c.text} ${appt.status === 'cancelled' ? 'opacity-50' : ''}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="text-[11px] font-semibold leading-tight truncate">{appt.patient}</div>
                        {height > 28 && (
                          <div className="text-[10px] opacity-70 truncate">{appt.type}</div>
                        )}
                        {height > 44 && (
                          <div className="text-[10px] opacity-60 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{appt.duration} мин.
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Patients View ──────────────────────────────────────── */

function PatientsView({ onPatientClick }) {
  const [search, setSearch] = useState('')
  const filtered = PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Търсете пациент по име или телефон..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-medical-400 focus:ring-1 focus:ring-medical-400/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto divide-y divide-slate-100">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => onPatientClick(p)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-medical-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-medical-700">
                {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 truncate">{p.name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                <span className="text-slate-300">·</span>
                <span>{p.doctor}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-400">{p.visits} посещения</div>
              <div className="text-xs text-slate-300 mt-0.5">{p.lastVisit}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">Няма намерени пациенти</div>
        )}
      </div>
    </div>
  )
}

/* ─── Messages View ──────────────────────────────────────── */

function MessagesView() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700">Вътрешни съобщения</h3>
      </div>
      <div className="flex-1 overflow-auto divide-y divide-slate-100">
        {MESSAGES.map(msg => (
          <div key={msg.id} className={`flex gap-3 px-4 py-3.5 ${msg.unread ? 'bg-medical-50/50' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-slate-700">{msg.from}</span>
                <span className="text-xs text-slate-400">{msg.time}</span>
              </div>
              <p className="text-sm text-slate-600 leading-snug">{msg.text}</p>
            </div>
            {msg.unread && (
              <div className="w-2 h-2 rounded-full bg-medical-500 mt-1.5 shrink-0" />
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-400">
          <Lock className="w-3.5 h-3.5" />
          Изпращането е деактивирано в демо режим
        </div>
      </div>
    </div>
  )
}

/* ─── Modals ─────────────────────────────────────────────── */

function AppointmentModal({ appt, onClose }) {
  const doc = DOCTORS.find(d => d.id === appt.doctor)
  const c = COLOR_MAP[doc?.color || 'emerald']

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`px-5 py-4 ${c.bg} border-b ${c.border}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-bold text-base ${c.text}`}>{appt.patient}</h3>
              <p className={`text-sm mt-0.5 ${c.text} opacity-80`}>{appt.type}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <InfoRow icon={Clock} label="Час" value={`${appt.hour}:${String(appt.min).padStart(2, '0')} — ${appt.duration} мин.`} />
          <InfoRow icon={User} label="Лекар" value={doc?.name} />
          <InfoRow icon={Phone} label="Телефон" value={appt.phone} />
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">Статус</span>
            <StatusBadge status={appt.status} />
          </div>
        </div>
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Редактирането е деактивирано в демо режим
          </div>
        </div>
      </div>
    </div>
  )
}

function PatientModal({ patient, onClose }) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-medical-100 flex items-center justify-center">
                <span className="text-sm font-bold text-medical-700">
                  {patient.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{patient.name}</h3>
                <p className="text-xs text-slate-500">{patient.visits} посещения</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <InfoRow icon={Phone} label="Телефон" value={patient.phone} />
          <InfoRow icon={Mail} label="Имейл" value={patient.email} />
          <InfoRow icon={User} label="Лекар" value={patient.doctor} />
          <InfoRow icon={Clock} label="Последно посещение" value={patient.lastVisit} />
          {patient.notes && (
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-400 mb-1">Бележки</div>
                <p className="text-sm text-slate-700">{patient.notes}</p>
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Редактирането е деактивирано в демо режим
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs text-slate-400">{label}:</span>
        <span className="text-sm text-slate-700 font-medium">{value}</span>
      </div>
    </div>
  )
}

/* ─── Main Demo Component ────────────────────────────────── */

export default function InteractiveDemo({ onClose }) {
  const [tab, setTab] = useState('calendar')
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)

  const tabs = [
    { id: 'calendar', label: 'График', icon: Calendar },
    { id: 'patients', label: 'Пациенти', icon: Users },
    { id: 'messages', label: 'Съобщения', icon: MessageSquare },
  ]

  const today = new Intl.DateTimeFormat('bg-BG', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[90vh] max-h-[700px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">

        {/* App header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-medical-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="font-bold text-slate-900 text-sm hidden sm:inline">
              Dent<span className="text-medical-500">Pro</span>
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">· Демо режим</span>
          </div>

          <ReadOnlyBadge />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-8 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                  <span className="text-xs font-semibold text-slate-600">Известия</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-start gap-3 px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-700">Иван Димитров промени часа си</p>
                      <p className="text-xs text-slate-400 mt-0.5">преди 15 мин.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-700">Анна Петкова потвърди часа</p>
                      <p className="text-xs text-slate-400 mt-0.5">преди 1 час</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Затвори"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <nav className="flex gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === id
                    ? 'bg-white text-medical-600 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {tab === 'calendar' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button className="p-1 rounded hover:bg-slate-200 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-medium text-slate-700 capitalize">{today}</span>
              <button className="p-1 rounded hover:bg-slate-200 transition-colors">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
            disabled
            title="Деактивирано в демо режим"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">Нов час</span>
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden relative">
          {tab === 'calendar' && (
            <CalendarView onAppointmentClick={setSelectedAppt} />
          )}
          {tab === 'patients' && (
            <PatientsView onPatientClick={setSelectedPatient} />
          )}
          {tab === 'messages' && (
            <MessagesView />
          )}

          {/* Modals */}
          {selectedAppt && (
            <AppointmentModal appt={selectedAppt} onClose={() => setSelectedAppt(null)} />
          )}
          {selectedPatient && (
            <PatientModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
          )}
        </div>

        {/* Demo banner */}
        <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-medical-600 to-emerald-500 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium leading-snug">
              <span className="hidden sm:inline">Вие сте в Демо режим. </span>
              За реални пациенти — вземете безплатен бета достъп (ограничено до 100 клиники).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-white/70 hover:text-white transition-colors"
            >
              Затвори
            </button>
            <a
              href={APP_REGISTER_URL}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-medical-600 font-semibold text-xs rounded-lg hover:bg-medical-50 transition-colors shadow-sm"
            >
              Безплатен достъп <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
