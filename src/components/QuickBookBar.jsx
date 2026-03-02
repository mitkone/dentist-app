import { useState } from 'react';
import { Zap, Clock } from 'lucide-react';

export default function QuickBookBar({ dentists, findNextFreeForDentist, onBook, canUse }) {
  const [selectedDentistId, setSelectedDentistId] = useState(dentists[0]?.id ?? '');

  if (!canUse || !dentists.length || !findNextFreeForDentist || !onBook) return null;

  const next = findNextFreeForDentist(selectedDentistId);
  const dentist = dentists.find((d) => d.id === selectedDentistId);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700">
      <span className="flex items-center gap-1.5 text-sm text-slate-300">
        <Zap className="w-4 h-4 text-amber-400" />
        Бърз запис:
      </span>
      <select
        value={selectedDentistId}
        onChange={(e) => setSelectedDentistId(e.target.value)}
        className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500/40 outline-none"
      >
        {dentists.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      {next && (
        <>
          <span className="flex items-center gap-1 text-sm text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {next.date} {next.time}
          </span>
          <button
            type="button"
            onClick={() => onBook(dentist?.id, next)}
            className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500"
          >
            Запиши
          </button>
        </>
      )}
      {!next && <span className="text-sm text-slate-500">Няма свободен час</span>}
    </div>
  );
}
