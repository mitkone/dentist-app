import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { appointmentTypeLabel, OTHER_APPOINTMENT_TYPE_KEY, APPOINTMENT_LOCATION_OPTIONS } from '../data/mockData';
import { withOtherOption, resolveTypeForSave } from '../lib/appointmentTypeUi';
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

export default function AddAppointmentModal({ open, onClose, dentist, slot, dentists, patients, onSubmit, appointmentTypes = [], appointments = [], onOpenPatientProfile, bookingDate = null }) {
  const [submitError, setSubmitError] = useState('');
  const [patientInput, setPatientInput] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [typeKey, setTypeKey] = useState('');
  const [customTypeText, setCustomTypeText] = useState('');
  const [location, setLocation] = useState(APPOINTMENT_LOCATION_OPTIONS[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const q = (patientInput || '').trim().toLowerCase();
  const suggestions =
    q.length >= 1
      ? patients.filter((p) => {
          const blob = [p.name, p.phone, p.parentPhone, p.notes].filter(Boolean).join(' ').toLowerCase();
          return blob.includes(q);
        })
      : [];
  const matchedPatient = patients.find((p) => (p.name || '').trim().toLowerCase() === patientInput.trim().toLowerCase());
  const typeOptions = useMemo(
    () =>
      withOtherOption(
        appointmentTypes.length > 0
          ? appointmentTypes
          : DEFAULT_APPOINTMENT_TYPES.map((t) => ({ key: t.value, label_bg: appointmentTypeLabel(t.labelKey) }))
      ),
    [appointmentTypes]
  );

  useEffect(() => {
    if (open) {
      setSubmitError('');
      setPatientInput('');
      setPatientPhone('');
      setNotes('');
      setCustomTypeText('');
      setLocation(APPOINTMENT_LOCATION_OPTIONS[0]);
      setEndTime(addMinutesToTime(slot, 30));
      const first = typeOptions[0]?.key;
      setTypeKey(first || '');
    }
  }, [open, slot, typeOptions]);
  useEffect(() => {
    if (matchedPatient) setPatientPhone(matchedPatient.phone ?? '');
  }, [matchedPatient?.id]);
  if (!open) return null;

  const selectedDentist = dentists.find((d) => d.id === dentist);

  const getDurationFromEnd = () => {
    const [sh, sm] = (slot || '09:00').split(':').map(Number);
    const [eh, em] = (endTime || '09:30').split(':').map(Number);
    return (eh - sh) * 60 + (em - sm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const form = e.target;
    const type = resolveTypeForSave(typeKey, customTypeText, typeOptions);
    const insurance = form.insurance?.value || 'private';
    const name = patientInput.trim();
    const patientId = matchedPatient?.id ?? null;
    const patientName = name || (matchedPatient?.name ?? '');
    const phone = patientPhone.trim() || (matchedPatient?.phone ?? null);
    const durationMinutes = getDurationFromEnd();
    if (durationMinutes < 1) {
      setSubmitError('Краят на часа трябва да е след началото.');
      return;
    }
    const end = endTime || addMinutesToTime(slot, 30);
    try {
      const result = await Promise.resolve(
        onSubmit({
          dentistId: dentist,
          patientId,
          patientName,
          patientPhone: phone || null,
          start: slot,
          end,
          type,
          durationMinutes,
          insurance,
          notes: notes.trim(),
          location,
          appointmentDate: bookingDate || undefined,
        })
      );
      if (result && result.ok === false) {
        setSubmitError(typeof result.error === 'string' ? result.error : 'Часът не бе записан. Проверете връзката или правата в Supabase.');
        return;
      }
    } catch (err) {
      setSubmitError(err?.message || 'Неочаквана грешка при запис.');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-semibold text-slate-900">Нов час</h3>
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
            <label className="block text-sm font-medium text-slate-800 mb-1">Стоматолог</label>
            <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm border border-slate-200">
              {selectedDentist?.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Начало</label>
            <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm border border-slate-200">{slot}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Край на часа</label>
            <div className="flex flex-wrap gap-2 items-center">
              <TimePicker24 value={endTime} onChange={setEndTime} />
              <span className="text-xs text-slate-500">или бързи:</span>
              {DURATION_PRESETS.map(({ mins, label }) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEndTime(addMinutesToTime(slot, mins))}
                  className="px-2 py-1 rounded text-xs font-medium bg-slate-200 text-slate-800 hover:bg-slate-300"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative" ref={suggestionRef}>
            <label htmlFor="patientName" className="block text-sm font-medium text-slate-800 mb-1">
              Пациент <span className="text-slate-500 font-normal">(въведете име или изберете от базата)</span>
            </label>
            <input
              id="patientName"
              name="patientName"
              type="text"
              value={patientInput}
              onChange={(e) => { setPatientInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { if (patientInput.trim()) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Въведете име или телефон..."
              required
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-0.5 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-100 shadow-lg z-50">
                {suggestions.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setPatientInput(p.name || ''); setPatientPhone(p.phone || ''); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-200 flex flex-col"
                  >
                    <span className="font-medium">{p.name || '—'}</span>
                    {p.phone && <span className="text-xs text-slate-500">{p.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="patientPhone" className="block text-sm font-medium text-slate-800 mb-1">
              Телефон <span className="text-slate-500 font-normal">(по избор)</span>
            </label>
            <input
              id="patientPhone"
              name="patientPhone"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="+359 ..."
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
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
            <label htmlFor="type" className="block text-sm font-medium text-slate-800 mb-1">
              Вид преглед
            </label>
            <select
              id="type"
              name="type"
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
            >
              {typeOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
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
            <label htmlFor="appointment-notes" className="block text-sm font-medium text-slate-800 mb-1">
              Бележка за часа <span className="text-slate-500 font-normal">(по избор)</span>
            </label>
            <textarea
              id="appointment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Напр. алергии, препоръки..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm resize-y"
            />
          </div>

          <div>
            <label htmlFor="appointment-location" className="block text-sm font-medium text-slate-800 mb-1">
              Кабинет
            </label>
            <select
              id="appointment-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-sm"
              required
            >
              {APPOINTMENT_LOCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-800 mb-1">
              Плащане
            </span>
            <div className="flex gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="insurance"
                  value="private"
                  defaultChecked
                  className="rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-white"
                />
                <span>Частно</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="insurance"
                  value="nhif"
                  className="rounded border-slate-300 bg-slate-100 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-white"
                />
                <span>По здравна каса</span>
              </label>
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
          )}

          <div className="flex gap-2 pt-2">
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
              Добави час
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
