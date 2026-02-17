import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appointmentTypeLabel, specialtyLabel } from '../data/mockData';
import PatientChronologyBlock from './PatientChronologyBlock';

const DEFAULT_APPOINTMENT_TYPES = [
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

export default function AddAppointmentModal({ open, onClose, dentist, slot, dentists, patients, onSubmit, appointmentTypes = [], appointments = [], onOpenPatientProfile }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? '');
  useEffect(() => {
    if (open && patients.length) setSelectedPatientId(patients[0]?.id ?? '');
  }, [open, patients]);
  if (!open) return null;

  const selectedDentist = dentists.find((d) => d.id === dentist);
  const defaultPatient = patients[0]?.id;
  const typeOptions = appointmentTypes.length > 0 ? appointmentTypes : DEFAULT_APPOINTMENT_TYPES.map((t) => ({ key: t.value, label_bg: appointmentTypeLabel(t.labelKey) }));
  const defaultType = (typeOptions[0]?.key) || 'Checkup';
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const patientId = form.patientId?.value || selectedPatientId || defaultPatient;
    const type = form.type?.value || defaultType;
    const durationMinutes = Number(form.duration?.value) || 30;
    const insurance = form.insurance?.value || 'private';
    onSubmit({ dentistId: dentist, patientId, start: slot, type, durationMinutes, insurance });
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
              {selectedDentist?.name} — {selectedDentist && specialtyLabel(selectedDentist.specialty)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Час</label>
            <div className="px-3 py-2 rounded-lg bg-slate-800 text-slate-100 text-sm border border-slate-700">{slot}</div>
          </div>

          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-slate-200 mb-1">
              Пациент
            </label>
            <select
              id="patientId"
              name="patientId"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
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
            patientId={selectedPatientId}
            patientName={selectedPatient?.name}
            appointments={appointments}
            dentists={dentists}
            appointmentTypes={typeOptions}
            onOpenProfile={onOpenPatientProfile ? (id) => { onClose(); onOpenPatientProfile(id); } : undefined}
          />

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-slate-200 mb-1">
              Продължителност (от началото на часа)
            </label>
            <select
              id="duration"
              name="duration"
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
