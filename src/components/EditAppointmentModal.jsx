import { useState, useEffect, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import { appointmentTypeLabel, getSlots, HOURS, OTHER_APPOINTMENT_TYPE_KEY, APPOINTMENT_LOCATION_OPTIONS } from '../data/mockData';
import { withOtherOption, resolveTypeForSave, parseTypeFromAppointment } from '../lib/appointmentTypeUi';
import PatientChronologyBlock from './PatientChronologyBlock';
import TimePicker24 from './TimePicker24';

const APPOINTMENT_TYPES = [
  { value: 'Checkup', labelKey: 'Checkup' },
  { value: 'Filling', labelKey: 'Filling' },
  { value: 'Extraction', labelKey: 'Extraction' },
  { value: 'Consultation', labelKey: 'Consultation' },
  { value: 'Follow-up', labelKey: 'Follow-up' },
  { value: 'Cleaning', labelKey: 'Cleaning' },
];

const DURATION_PRESETS = [
  { mins: 15, label: '15 мин' },
  { mins: 30, label: '30 мин' },
  { mins: 45, label: '45 мин' },
  { mins: 60, label: '1 ч' },
  { mins: 75, label: '1 ч 15 мин' },
  { mins: 90, label: '1 ч 30 мин' },
  { mins: 105, label: '1 ч 45 мин' },
  { mins: 120, label: '2 ч' },
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

export default function EditAppointmentModal({ open, onClose, appointment, dentists, patients, onSave, onDelete, workingHours = HOURS, appointmentTypes = [], appointments = [], onOpenPatientProfile, canChangeDentist = true }) {
  const [date, setDate] = useState('');
  const [dentistId, setDentistId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [patientInput, setPatientInput] = useState('');
  const [typeKey, setTypeKey] = useState('Checkup');
  const [customTypeText, setCustomTypeText] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [attendance, setAttendance] = useState('pending');
  const [insurance, setInsurance] = useState('private');
  const [location, setLocation] = useState(APPOINTMENT_LOCATION_OPTIONS[0]);

  const slots = getSlots(workingHours);
  const typeOptions = useMemo(
    () =>
      withOtherOption(
        appointmentTypes.length > 0 ? appointmentTypes : APPOINTMENT_TYPES.map((t) => ({ key: t.value, label_bg: appointmentTypeLabel(t.labelKey) }))
      ),
    [appointmentTypes]
  );
  const isPast = appointment ? isAppointmentInPast(appointment) : false;
  const matchedPatient = patients.find((p) => p.name.trim().toLowerCase() === patientInput.trim().toLowerCase());

  useEffect(() => {
    if (appointment) {
      setDate(appointment.date ?? '');
      setDentistId(appointment.dentistId);
      setStart(appointment.start);
      setEnd(appointment.end ?? addMinutes(appointment.start, 30));
      const p = appointment.patientId ? patients.find((x) => x.id === appointment.patientId) : null;
      setPatientInput(p?.name ?? appointment.patientName ?? '');
      const parsed = parseTypeFromAppointment(appointment.type, typeOptions);
      setTypeKey(parsed.key);
      setCustomTypeText(parsed.custom);
      setDurationMinutes(getDurationMinutes(appointment.start, appointment.end));
      setNotes(appointment.notes ?? '');
      setAttendance(appointment.attendance || 'pending');
      setInsurance(appointment.insurance || 'private');
      setLocation(appointment.location || APPOINTMENT_LOCATION_OPTIONS[0]);
    }
  }, [appointment, patients, typeOptions]);

  if (!open || !appointment) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const endTime = end || addMinutes(start, durationMinutes);
    const name = patientInput.trim();
    onSave(appointment.id, {
      date: date || appointment.date,
      dentistId,
      start,
      end: endTime,
      patientName: (name || matchedPatient?.name) ?? appointment.patientName,
      patientId: matchedPatient?.id || undefined,
      type: resolveTypeForSave(typeKey, customTypeText, typeOptions),
      notes: notes.trim() || '',
      attendance: isPast ? attendance : undefined,
      insurance,
      location,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!window.confirm('Изтриване на този час?')) return;
    onDelete(appointment.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-semibold text-slate-900">Редактиране на час</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm [color-scheme:light]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Стоматолог</label>
            {canChangeDentist ? (
              <select
                value={dentistId}
                onChange={(e) => setDentistId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              >
                {dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-900 text-sm">
                {dentists.find((d) => d.id === dentistId)?.name ?? dentistId}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Начало</label>
            <select
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Край на часа</label>
            <div className="flex flex-wrap gap-2 items-center">
              <TimePicker24 value={end} onChange={setEnd} />
              {DURATION_PRESETS.map(({ mins, label }) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEnd(addMinutes(start, mins))}
                  className="px-2 py-1 rounded text-xs font-medium bg-slate-200 text-slate-800 hover:bg-slate-300"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="edit-patientName" className="block text-sm font-medium text-slate-800 mb-1">
              Пациент <span className="text-slate-500 font-normal">(изберете или въведете име)</span>
            </label>
            <input
              id="edit-patientName"
              type="text"
              list="edit-patient-suggestions"
              value={patientInput}
              onChange={(e) => setPatientInput(e.target.value)}
              placeholder="Въведете име на пациента..."
              required
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              autoComplete="off"
            />
            <datalist id="edit-patient-suggestions">
              {patients.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>

          <PatientChronologyBlock
            patientId={matchedPatient?.id}
            patientName={(patientInput.trim() || matchedPatient?.name) ?? appointment?.patientName}
            appointments={appointments}
            dentists={dentists}
            appointmentTypes={typeOptions}
            onOpenProfile={onOpenPatientProfile ? (id) => { onClose(); onOpenPatientProfile(id); } : undefined}
          />

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Вид преглед</label>
            <select
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {typeOptions.map((opt) => (
                <option key={opt.key ?? opt.label_bg} value={opt.key}>
                  {opt.label_bg}
                </option>
              ))}
            </select>
            {typeKey === OTHER_APPOINTMENT_TYPE_KEY && (
              <input
                type="text"
                value={customTypeText}
                onChange={(e) => setCustomTypeText(e.target.value)}
                placeholder="Опишете манипулацията..."
                className="mt-2 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 outline-none text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Кабинет</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {APPOINTMENT_LOCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Плащане</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setInsurance('private')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  insurance === 'private'
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                По здравна каса
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Бележки за часа</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Бележки по прегледа..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm resize-y"
            />
          </div>

          {isPast && (
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Пациентът</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAttendance('showed')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    attendance === 'showed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
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
              className="px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-200/80 rounded-lg border border-slate-300"
            >
              <Trash2 className="w-4 h-4 inline-block mr-1.5 align-middle" />
              Изтрий час
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-200 rounded-lg hover:bg-slate-300"
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
