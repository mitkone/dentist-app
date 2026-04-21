import { useState, useEffect, useRef } from 'react';
import { Zap, Clock, CalendarDays, ChevronDown } from 'lucide-react';

function toDateStr(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateStr(dt);
}

function formatShortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' });
}

export default function QuickBookBar({ dentists, findFirstFreeForDate, findAllFreeSlotsForDate, onBook, canUse, currentDate }) {
  const ANY_DENTIST_KEY = '__any_dentist__';
  const [selectedDentistId, setSelectedDentistId] = useState(ANY_DENTIST_KEY);
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(currentDate));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (currentDate) setSelectedDate(toDateStr(currentDate));
  }, [currentDate]);

  useEffect(() => {
    if (selectedDentistId === ANY_DENTIST_KEY) return;
    if (!dentists.some((d) => d.id === selectedDentistId)) setSelectedDentistId(ANY_DENTIST_KEY);
  }, [dentists, selectedDentistId]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowTimePicker(false);
    };
    if (showTimePicker) document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [showTimePicker]);

  if (!canUse || !dentists.length || !onBook) return null;

  const dentist = dentists.find((d) => d.id === selectedDentistId);
  const inAnyMode = selectedDentistId === ANY_DENTIST_KEY;
  const firstSlot = inAnyMode
    ? dentists
        .map((d) => {
          const slot = findFirstFreeForDate?.(d.id, selectedDate);
          return slot ? { ...slot, dentistId: d.id, dentistName: d.name } : null;
        })
        .filter(Boolean)
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0] ?? null
    : (findFirstFreeForDate?.(selectedDentistId, selectedDate) ?? null);
  const allSlots = inAnyMode
    ? dentists
        .flatMap((d) =>
          (findAllFreeSlotsForDate?.(d.id, selectedDate) ?? []).map((s) => ({
            ...s,
            dentistId: d.id,
            dentistName: d.name,
          }))
        )
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
        .slice(0, 30)
    : (findAllFreeSlotsForDate?.(selectedDentistId, selectedDate) ?? []);
  const displaySlot = firstSlot;
  const freeDates = [];
  for (let i = 0; i < 45 && freeDates.length < 7; i += 1) {
    const dStr = addDays(selectedDate, i);
    const slot = inAnyMode
      ? dentists.some((d) => Boolean(findFirstFreeForDate?.(d.id, dStr)))
      : Boolean(findFirstFreeForDate?.(selectedDentistId, dStr));
    if (slot) freeDates.push(dStr);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-100/90 border border-slate-200">
      <span className="flex items-center gap-1.5 text-sm text-slate-600">
        <Zap className="w-4 h-4 text-amber-400" />
        Бърз запис:
      </span>
      <select
        value={selectedDentistId}
        onChange={(e) => setSelectedDentistId(e.target.value)}
        className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
      >
        <option value={ANY_DENTIST_KEY}>Първи свободен (всички лекари)</option>
        {dentists.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <CalendarDays className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-2 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none [color-scheme:light]"
        />
      </div>
      {freeDates.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {freeDates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={`px-2 py-1 rounded text-xs border ${
                selectedDate === d
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Дата със свободен час"
            >
              {formatShortDate(d)}
            </button>
          ))}
        </div>
      )}
      {displaySlot && (
        <>
          <div ref={pickerRef} className="relative">
            <button
              type="button"
              onClick={() => allSlots.length > 1 && setShowTimePicker((v) => !v)}
              className={`flex items-center gap-1 text-sm font-medium rounded-lg px-2 py-1.5 transition-colors ${
                allSlots.length > 1
                  ? 'text-emerald-700 hover:bg-emerald-50/90 cursor-pointer'
                  : 'text-slate-600 cursor-default'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {displaySlot.date} {displaySlot.time}
              {displaySlot.dentistName && <span className="text-slate-500">· {displaySlot.dentistName}</span>}
              {allSlots.length > 1 && <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
            </button>
            {showTimePicker && allSlots.length > 1 && (
              <div className="absolute top-full left-0 mt-1 py-1 bg-slate-100 border border-slate-300 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto min-w-[200px]">
                {allSlots.map((s) => (
                  <button
                    key={`${s.dentistId || dentist?.id || 'd'}-${s.date}-${s.time}`}
                    type="button"
                    onClick={() => {
                      onBook(s.dentistId || dentist?.id, s);
                      setShowTimePicker(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-200 focus:bg-slate-200"
                  >
                    {inAnyMode ? `${s.time} · ${s.dentistName}` : s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onBook(displaySlot?.dentistId || dentist?.id, displaySlot)}
            className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
          >
            Запиши
          </button>
        </>
      )}
      {!displaySlot && <span className="text-sm text-slate-500">Няма свободен час</span>}
    </div>
  );
}
