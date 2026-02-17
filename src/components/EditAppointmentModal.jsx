import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { appointmentTypeLabel, specialtyLabel, getSlots, HOURS } from '../data/mockData';
import PatientChronologyBlock from './PatientChronologyBlock';

const APPOINTMENT_TYPES = [
  { value: 'Checkup', labelKey: 'Checkup' },
  { value: 'Filling', labelKey: 'Filling' },
  { value: 'Extraction', labelKey: 'Extraction' },
  { value: 'Consultation', labelKey: 'Consultation' },
  { value: 'Follow-up', labelKey: 'Follow-up' },
  { value: 'Cleaning', labelKey: 'Cleaning' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 мин' },
  { value: 30, label: '30 мин' },
  { value: 45, label: '45 мин' },
  { value: 60, label: '1 ч' },
  { value: 90, label: '1 ч 30 мин' },
  { value: 120, label: '2 ч' },
  { value: 180, label: '3 ч' },
  { value: 240, label: '4 ч' },
  { value: 300, label: '5 ч' },
  { value: 360, label: '6 ч' },
  { value: 420, label: '7 ч' },
  { value: 480, label: '8 ч' },
  { value: 540, label: '9 ч' },
  { value: 600, label: '10 ч' },
  { value: 660, label: '11 ч' },
  { value: 720, label: '12 ч' },
];

function getDurationMinutes(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh - sh) * 60 + (em - sm);
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function isAppointmentInPast(appointment) {
  if (!appointment?.date || !appointment?.end) return false;
  const [y, m, d] = appointment.date.split('-').map(Number);
  const [eh, em] = appointment.end.split(':').map(Number);
  const endDate = new Date(y, m - 1, d, eh, em);
  return endDate.getTime() < Date.now();
}

export default function EditAppointmentModal({ open, onClose, appointment, dentists, patients, onSave, onDelete, workingHours = HOURS, appointmentTypes = [], appointments = [], onOpenPatientProfile }) {
  const [dentistId, setDentistId] = useState('');
  const [start, setStart] = useState('');
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('Checkup');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [attendance, setAttendance] = useState('pending');
  const [insurance, setInsurance] = useState('private');

  const slots = getSlots(workingHours);
  const typeOptions = appointmentTypes.length > 0 ? appointmentTypes : APPOINTMENT_TYPES.map((t) => ({ key: t.value, label_bg: appointmentTypeLabel(t.labelKey) }));
  const isPast = appointment ? isAppointmentInPast(appointment) : false;

  useEffect(() => {
    if (appointment) {
      setDentistId(appointment.dentistId);
      setStart(appointment.start);
      setPatientId(appointment.patientId || (patients.find((p) => p.name === appointment.patientName)?.id ?? patients[0]?.id));
      setType(appointment.type || 'Checkup');
      setDurationMinutes(getDurationMinutes(appointment.start, appointment.end));
      setNotes(appointment.notes ?? '');
      setAttendance(appointment.attendance || 'pending');
      setInsurance(appointment.insurance || 'private');
    }
  }, [appointment, patients]);

  if (!open || !appointment) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const end = addMinutes(start, durationMinutes);
    const patient = patients.find((p) => p.id === patientId);
    onSave(appointment.id, {
      dentistId,
      start,
      end,
      patientName: patient?.name ?? appointment.patientName,
      patientId: patientId || undefined,
      type,
      notes: notes.trim() || '',
      attendance: isPast ? attendance : undefined,
      insurance,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm('Изтриване на този час?')) return;
    onDelete(appointment.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white">Редактиране на час</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Стоматолог</label>
            <select
              value={dentistId}
              onChange={(e) => setDentistId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {specialtyLabel(d.specialty)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Начало</label>
            <select
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Пациент</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.phone ? ` — ${p.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <PatientChronologyBlock
            patientId={patientId}
            patientName={patients.find((p) => p.id === patientId)?.name ?? appointment?.patientName}
            appointments={appointments}
            dentists={dentists}
            appointmentTypes={typeOptions}
            onOpenProfile={onOpenPatientProfile ? (id) => { onClose(); onOpenPatientProfile(id); } : undefined}
          />

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Продължителност</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Вид преглед</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {typeOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label_bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Плащане</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setInsurance('private')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  insurance === 'private'
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Частно
              </button>
              <button
                type="button"
                onClick={() => setInsurance('nhif')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  insurance === 'nhif'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                По здравна каса
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Бележки за часа</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Бележки по прегледа..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm resize-y"
            />
          </div>

          {isPast && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Пациентът</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAttendance('showed')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    attendance === 'showed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Дойде
                </button>
                <button
                  type="button"
                  onClick={() => setAttendance('no_show')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    attendance === 'no_show'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Не се яви
                </button>
                <button
                  type="button"
                  onClick={() => setAttendance('pending')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    attendance === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  —
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-700/80 rounded-lg border border-slate-600"
            >
              <Trash2 className="w-4 h-4 inline-block mr-1.5 align-middle" />
              Изтрий час
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
            >
              Запази
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
