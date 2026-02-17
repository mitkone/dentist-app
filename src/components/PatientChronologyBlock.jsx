import { useMemo } from 'react';
import { CalendarCheck, User } from 'lucide-react';
import { appointmentTypeLabel } from '../data/mockData';

function formatDisplayDate(dateStr) {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export default function PatientChronologyBlock({
  patientId,
  patientName,
  appointments = [],
  dentists = [],
  appointmentTypes = [],
  onOpenProfile,
}) {
  const visitHistory = useMemo(() => {
    if (!patientId && !patientName) return [];
    const nameNorm = (patientName || '').trim().toLowerCase();
    return appointments
      .filter(
        (a) =>
          (a.patientId && a.patientId === patientId) ||
          (a.patientName || '').trim().toLowerCase() === nameNorm
      )
      .sort((a, b) => {
        const d = (a.date || '').localeCompare(b.date || '', undefined, { numeric: true });
        return d !== 0 ? -d : (b.start || '').localeCompare(a.start || '');
      });
  }, [patientId, patientName, appointments]);

  const getTypeLabel = (key) =>
    appointmentTypes.find((t) => t.key === key)?.label_bg ?? appointmentTypeLabel(key);
  const attendanceLabel = (a) =>
    a === 'showed' ? 'Дойде' : a === 'no_show' ? 'Не се яви' : null;

  if (!patientId && !patientName) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
      <h4 className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
        <CalendarCheck className="w-4 h-4 text-emerald-400" />
        Хронология на пациента
      </h4>
      {visitHistory.length === 0 ? (
        <p className="text-xs text-slate-500 py-1">Няма записани часове</p>
      ) : (
        <ul className="space-y-1.5 max-h-32 overflow-y-auto scroll-thin text-xs">
          {visitHistory.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 px-2 rounded bg-slate-800 text-slate-200"
            >
              <span className="font-medium text-slate-100">{formatDisplayDate(a.date)}</span>
              {a.start && (
                <span className="text-slate-400">
                  {a.start}
                  {a.end ? ` – ${a.end}` : ''}
                </span>
              )}
              <span className="text-slate-400 w-full">
                {dentists.find((d) => d.id === a.dentistId)?.name ?? '—'} · {getTypeLabel(a.type)}
                {a.attendance && a.attendance !== 'pending' && (
                  <span className="ml-1 text-amber-400">· {attendanceLabel(a.attendance)}</span>
                )}
              </span>
              {a.notes && (
                <span className="text-slate-500 block truncate w-full mt-0.5" title={a.notes}>
                  {a.notes}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {onOpenProfile && patientId && (
        <button
          type="button"
          onClick={() => onOpenProfile(patientId)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-emerald-500/50"
        >
          <User className="w-3.5 h-3.5" />
          Профил и прикачени файлове (снимки)
        </button>
      )}
    </div>
  );
}
