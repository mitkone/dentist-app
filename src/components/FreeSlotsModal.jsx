import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { getSlots, APPOINTMENT_LOCATION_OPTIONS } from '../data/mockData';

function toDateStr(d) {
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
}

function parseDateStr(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function FreeSlotsModal({ open, onClose, dentist: initialDentist, dentists = [], date: initialDate, workingHours, onSave, supabase, doctorVacations = [] }) {
  const LOCATION_OPTIONS = APPOINTMENT_LOCATION_OPTIONS;
  const [dentist, setDentist] = useState(initialDentist ?? dentists[0]);
  const [date, setDate] = useState(initialDate ?? new Date());
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate, open]);

  const dateStr = toDateStr(date);
  const isOnVacationDay = Boolean(
    dentist?.id && dateStr && doctorVacations.some((v) => v.dentist_id === dentist.id && v.start_date <= dateStr && v.end_date >= dateStr)
  );

  useEffect(() => {
    if (!initialDentist && dentists.length) setDentist(dentists[0]);
    else if (initialDentist) setDentist(initialDentist);
  }, [initialDentist, dentists]);

  useEffect(() => {
    if (!open || !dentist) return;
    const s = getSlots(workingHours);
    setSlots(s);
    if (isOnVacationDay) {
      setSelected(new Set());
      setLoading(false);
      return;
    }
    if (!supabase) {
      setSelected(new Set(s));
      setLocation(LOCATION_OPTIONS[0]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('doctor_available_slots')
      .select('slots, location')
      .eq('dentist_id', dentist.id)
      .eq('date', dateStr)
      .maybeSingle()
      .then(({ data, error }) => {
        setLoading(false);
        if (error) return;
        setLocation(data?.location || LOCATION_OPTIONS[0]);
        if (data?.slots?.length) {
          setSelected(new Set(data.slots));
        } else {
          setSelected(new Set(s));
        }
      });
  }, [open, dentist?.id, dateStr, workingHours, supabase, isOnVacationDay]);

  if (!open) return null;

  const toggle = (slot) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(slots));
  const clearAll = () => setSelected(new Set());

  const handleSave = async () => {
    if (!supabase || !dentist) return;
    if (isOnVacationDay) return;
    setSaving(true);
    const slotsArr = Array.from(selected).sort();
    let { error } = await supabase
      .from('doctor_available_slots')
      .upsert(
        { dentist_id: dentist.id, date: dateStr, slots: slotsArr, location, updated_at: new Date().toISOString() },
        { onConflict: 'dentist_id,date' }
      );
    if (error && String(error.message || '').includes('location')) {
      ({ error } = await supabase
        .from('doctor_available_slots')
        .upsert({ dentist_id: dentist.id, date: dateStr, slots: slotsArr, updated_at: new Date().toISOString() }, { onConflict: 'dentist_id,date' }));
    }
    setSaving(false);
    if (!error) {
      onSave?.();
      onClose();
    }
  };

  const handleSaveLocationOnly = async () => {
    if (!supabase || !dentist) return;
    if (isOnVacationDay) return;
    setSavingLocation(true);
    const slotsArr = Array.from(selected).sort();
    let { error } = await supabase
      .from('doctor_available_slots')
      .upsert(
        { dentist_id: dentist.id, date: dateStr, slots: slotsArr, location, updated_at: new Date().toISOString() },
        { onConflict: 'dentist_id,date' }
      );
    if (error && String(error.message || '').includes('location')) {
      ({ error } = await supabase
        .from('doctor_available_slots')
        .upsert({ dentist_id: dentist.id, date: dateStr, slots: slotsArr, updated_at: new Date().toISOString() }, { onConflict: 'dentist_id,date' }));
    }
    setSavingLocation(false);
    if (!error) onSave?.();
  };

  const formatDate = (d) => d?.toLocaleDateString?.('bg-BG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
              Свободни часове
            </h3>
            {dentists.length > 1 ? (
              <select
                value={dentist?.id ?? ''}
                onChange={(e) => setDentist(dentists.find((d) => d.id === e.target.value))}
                className="mt-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm"
              >
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-500 mt-0.5">{dentist?.name}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-slate-500">Дата:</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDate(parseDateStr(e.target.value) ?? date)}
                className="px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm [color-scheme:light]"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-slate-500">Кабинет:</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 text-sm"
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveLocationOnly}
                disabled={savingLocation || loading || !supabase}
                className="px-2.5 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 disabled:opacity-50"
              >
                {savingLocation ? '...' : 'Запази'}
              </button>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="text-slate-500 py-8">Зареждане...</p>
          ) : (
            <>
              {isOnVacationDay && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  Лекарят е в отпуск за тази дата. Няма свободни часове за записване.
                </p>
              )}
              <div className="flex gap-2 mb-4">
                <button type="button" disabled={isOnVacationDay} onClick={selectAll} className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">
                  Избери всички
                </button>
                <button type="button" disabled={isOnVacationDay} onClick={clearAll} className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">
                  Изчисти
                </button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto scroll-thin grid grid-cols-4 sm:grid-cols-5 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    disabled={isOnVacationDay}
                    onClick={() => toggle(slot)}
                    className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                      selected.has(slot)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Изберете кои часове са свободни за записване. Само те ще се предлагат при добавяне на час.
              </p>
            </>
          )}

          <div className="flex gap-2 mt-5">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-800 bg-slate-200 rounded-lg hover:bg-slate-300">
              Отказ
            </button>
            <button type="button" onClick={handleSave} disabled={saving || loading || !supabase || isOnVacationDay} className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50">
              {saving ? 'Запазване...' : 'Запази'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
