import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Clock, Filter } from 'lucide-react';
import DentistBar from './DentistBar';

const formatHeaderDate = (d) =>
  d.toLocaleDateString('bg-BG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

function toInputDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarHeader({
  currentDate,
  onPrevDay,
  onNextDay,
  onToday,
  onDatePick,
  nextFree,
  dentists = [],
  selectedDentistIds = [],
  onDentistToggle,
}) {
  const [showDentists, setShowDentists] = useState(false);

  return (
    <header className="flex flex-col gap-3 md:gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-white">График</h1>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300 font-medium">{formatHeaderDate(currentDate)}</span>
          {onDentistToggle && dentists.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDentists((v) => !v)}
              className={`ml-1 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showDentists
                  ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50'
                  : 'text-slate-300 bg-slate-800 border-slate-700 hover:border-emerald-500/50 hover:text-emerald-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Лекари
            </button>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap sm:justify-end">
          {nextFree && nextFree.dentistName && (
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-300 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 order-first w-full sm:w-auto sm:order-none">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline text-slate-400">Най-рано свободен час:</span>
              <span className="font-medium text-slate-100 truncate">
                {nextFree.dentistName}
              </span>
              <span className="text-slate-400 shrink-0">
                · {nextFree.dateLabel} {nextFree.time}
              </span>
            </div>
          )}
          <div className="flex items-center justify-center gap-1 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={onPrevDay}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white"
              aria-label="Предишен ден"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 px-1">
              <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={toInputDate(currentDate)}
                onChange={(e) => onDatePick(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none [color-scheme:dark] w-36 sm:w-auto"
                title="Към дата"
              />
            </div>
            <button
              type="button"
              onClick={onNextDay}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white"
              aria-label="Следващ ден"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={onToday}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 border border-emerald-500/50"
          >
            <Calendar className="w-4 h-4" />
            Днес
          </button>
        </div>
      </div>
      {showDentists && onDentistToggle && dentists.length > 0 && (
        <div className="mt-1">
          <DentistBar
            dentists={dentists}
            selectedDentistIds={selectedDentistIds}
            onDentistToggle={onDentistToggle}
          />
        </div>
      )}
    </header>
  );
}
