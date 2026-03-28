import { useState, useEffect, useRef } from 'react';
import { Zap, Clock, CalendarDays, ChevronDown } from 'lucide-react';

function toDateStr(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function QuickBookBar({ dentists, findFirstFreeForDate, findAllFreeSlotsForDate, onBook, canUse, currentDate }) {
  const [selectedDentistId, setSelectedDentistId] = useState(dentists[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(currentDate));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (currentDate) setSelectedDate(toDateStr(currentDate));
  }, [currentDate]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowTimePicker(false);
    };
    if (showTimePicker) document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [showTimePicker]);

  if (!canUse || !dentists.length || !onBook) return null;

  const dentist = dentists.find((d) => d.id === selectedDentistId);
  const firstSlot = findFirstFreeForDate?.(selectedDentistId, selectedDate);
  const allSlots = findAllFreeSlotsForDate?.(selectedDentistId, selectedDate) ?? [];
  const displaySlot = firstSlot;

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
              {allSlots.length > 1 && <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
            </button>
            {showTimePicker && allSlots.length > 1 && (
              <div className="absolute top-full left-0 mt-1 py-1 bg-slate-100 border border-slate-300 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto min-w-[120px]">
                {allSlots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => {
                      onBook(dentist?.id, s);
                      setShowTimePicker(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-slate-800 hover:bg-slate-200 focus:bg-slate-200"
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onBook(dentist?.id, displaySlot)}
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
