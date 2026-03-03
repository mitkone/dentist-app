import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appointmentTypeLabel } from '../data/mockData';
import PatientChronologyBlock from './PatientChronologyBlock';
import TimePicker24 from './TimePicker24';

const DEFAULT_APPOINTMENT_TYPES = [
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

function addMinutesToTime(time, mins) {
  const [h, m] = (time || '09:00').split(':').map(Number);
  const total = h * 60 + m + mins;
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export default function AddAppointmentModal({ open, onClose, dentist, slot, dentists, patients, onSubmit, appointmentTypes = [], appointments = [], onOpenPatientProfile }) {
  const [patientInput, setPatientInput] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const matchedPatient = patients.find((p) => p.name.trim().toLowerCase() === patientInput.trim().toLowerCase());
  useEffect(() => {
    if (open) {
      setPatientInput(patients[0]?.name ?? '');
      setPatientPhone(patients[0]?.phone ?? '');
      setNotes('');
      setEndTime(addMinutesToTime(slot, 30));
    }
  }, [open, patients, slot]);
  useEffect(() => {
    if (matchedPatient) setPatientPhone(matchedPatient.phone ?? '');
  }, [matchedPatient?.id]);
  if (!open) return null;

  const selectedDentist = dentists.find((d) => d.id === dentist);
  const typeOptions = appointmentTypes.length > 0 ? appointmentTypes : DEFAULT_APPOINTMENT_TYPES.map((t) => ({ key: t.value, label_bg: appointmentTypeLabel(t.labelKey) }));
  const defaultType = (typeOptions[0]?.label_bg) ?? (typeOptions[0]?.key) ?? 'Преглед';

  const getDurationFromEnd = () => {
    const [sh, sm] = (slot || '09:00').split(':').map(Number);
    const [eh, em] = (endTime || '09:30').split(':').map(Number);
    return (eh - sh) * 60 + (em - sm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const type = form.type?.value || defaultType;
    const insurance = form.insurance?.value || 'private';
    const name = patientInput.trim();
    const patientId = matchedPatient?.id ?? null;
    const patientName = name || (matchedPatient?.name ?? '');
    const phone = patientPhone.trim() || (matchedPatient?.phone ?? null);
    const durationMinutes = getDurationFromEnd();
    if (durationMinutes < 1) return;
    const end = endTime || addMinutesToTime(slot, 30);
    onSubmit({ dentistId: dentist, patientId, patientName, patientPhone: phone || null, start: slot, end, type, durationMinutes, insurance, notes: notes.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900">
          <h3 className="text-lg font-semibold text-white">Нов час</h3>
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
            <div className="px-3 py-2 rounded-lg bg-slate-800 text-slate-100 text-sm border border-slate-700">
              {selectedDentist?.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Начало</label>
            <div className="px-3 py-2 rounded-lg bg-slate-800 text-slate-100 text-sm border border-slate-700">{slot}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Край на часа</label>
            <div className="flex flex-wrap gap-2 items-center">
              <TimePicker24 value={endTime} onChange={setEndTime} />
              <span className="text-xs text-slate-500">или бързи:</span>
              {DURATION_PRESETS.map(({ mins, label }) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEndTime(addMinutesToTime(slot, mins))}
                  className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-slate-200 mb-1">
              Пациент <span className="text-slate-500 font-normal">(изберете от списъка или въведете име)</span>
            </label>
            <input
              id="patientName"
              name="patientName"
              type="text"
              list="patient-suggestions"
              value={patientInput}
              onChange={(e) => setPatientInput(e.target.value)}
              placeholder="Въведете име на пациента..."
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              autoComplete="off"
            />
            <datalist id="patient-suggestions">
              {patients.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="patientPhone" className="block text-sm font-medium text-slate-200 mb-1">
              Телефон <span className="text-slate-500 font-normal">(по избор)</span>
            </label>
            <input
              id="patientPhone"
              name="patientPhone"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+359 ..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            />
          </div>

          <PatientChronologyBlock
            patientId={matchedPatient?.id}
            patientName={patientInput.trim() || matchedPatient?.name}
            appointments={appointments}
            dentists={dentists}
            appointmentTypes={typeOptions}
            onOpenProfile={onOpenPatientProfile ? (id) => { onClose(); onOpenPatientProfile(id); } : undefined}
          />

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-200 mb-1">
              Вид преглед
            </label>
            <select
              id="type"
              name="type"
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
            <label htmlFor="appointment-notes" className="block text-sm font-medium text-slate-200 mb-1">
              Бележка за часа <span className="text-slate-500 font-normal">(по избор)</span>
            </label>
            <textarea
              id="appointment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Напр. алергии, препоръки..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm resize-y"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-200 mb-1">
              Плащане
            </span>
            <div className="flex gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="radio"
                  name="insurance"
                  value="private"
                  defaultChecked
                  className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>Частно</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="radio"
                  name="insurance"
                  value="nhif"
                  className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                />
                <span>По здравна каса</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
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
              Добави час
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
