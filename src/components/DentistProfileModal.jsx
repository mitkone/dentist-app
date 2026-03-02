import { X, CalendarOff, Calendar } from 'lucide-react';

export default function DentistProfileModal({
  open,
  onClose,
  dentist,
  onOpenVacation,
  onOpenFreeSlots,
  canManageVacation,
  canManageFreeSlots,
}) {
  if (!open || !dentist) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full shrink-0"
              style={{ backgroundColor: dentist.color }}
            />
            <div>
              <h3 className="text-lg font-semibold text-white">{dentist.name}</h3>
              <p className="text-sm text-slate-400">Профил на стоматолог</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2">
          {(canManageVacation !== false) && onOpenVacation && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenVacation(dentist.id); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <CalendarOff className="w-5 h-5 text-amber-400" />
              <span>Отпуски</span>
            </button>
          )}
          {(canManageFreeSlots !== false) && onOpenFreeSlots && (
            <button
              type="button"
              onClick={() => { onClose(); onOpenFreeSlots(dentist); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Свободни часове</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
