import { useEffect, useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { APPOINTMENT_LOCATION_OPTIONS } from '../data/mockData';

function toDateStr(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DoctorDayLocationModal({
  open,
  onClose,
  dentist,
  initialDate,
  initialLocation = APPOINTMENT_LOCATION_OPTIONS[0],
  onSave,
}) {
  const [dateStr, setDateStr] = useState(() => toDateStr(initialDate || new Date()));
  const [location, setLocation] = useState(initialLocation || APPOINTMENT_LOCATION_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDateStr(toDateStr(initialDate || new Date()));
    setLocation(initialLocation || APPOINTMENT_LOCATION_OPTIONS[0]);
  }, [open, initialDate, initialLocation]);

  if (!open || !dentist) return null;

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave?.(dentist.id, dateStr, location);
    setSaving(false);
    if (ok) onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-500" />
            Кабинет по ден
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-700">{dentist.name}</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-12">Дата</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm [color-scheme:light]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 w-12">Кабинет</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm"
            >
              {APPOINTMENT_LOCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Тази настройка променя само кабинета за деня, без да променя свободните/блокираните часове.
          </p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 text-sm rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300">
              Отказ
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dateStr}
              className="flex-1 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Запазване...' : 'Запази'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
